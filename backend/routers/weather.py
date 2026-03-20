"""
Weather API integration using OpenWeatherMap.
Fetches real-time weather + AQI for Indian cities and converts to risk scores.
"""
from fastapi import APIRouter
import httpx

router = APIRouter(prefix="/weather", tags=["Weather"])

API_KEY = "15a7c82d24169e938101b0fd8cfc97f9"
WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather"
AQI_URL    = "http://api.openweathermap.org/data/2.5/air_pollution"

# Fallback mock data if API is slow or fails
MOCK_WEATHER = {
    "Mumbai":      {"temp": 32, "rain": 40, "aqi": 180, "desc": "Heavy Rain"},
    "Delhi":       {"temp": 38, "rain": 0,  "aqi": 320, "desc": "Haze"},
    "Bengaluru":   {"temp": 28, "rain": 10, "aqi": 90,  "desc": "Light Rain"},
    "Hyderabad":   {"temp": 35, "rain": 5,  "aqi": 130, "desc": "Partly Cloudy"},
    "Chennai":     {"temp": 36, "rain": 20, "aqi": 150, "desc": "Thunderstorm"},
    "Pune":        {"temp": 30, "rain": 15, "aqi": 110, "desc": "Moderate Rain"},
    "Jaipur":      {"temp": 40, "rain": 0,  "aqi": 200, "desc": "Extreme Heat"},
    "Lucknow":     {"temp": 37, "rain": 0,  "aqi": 250, "desc": "Smog"},
    "Bhubaneswar": {"temp": 34, "rain": 25, "aqi": 120, "desc": "Rain"},
    "Patna":       {"temp": 36, "rain": 5,  "aqi": 280, "desc": "Haze"},
    "Kolkata":     {"temp": 33, "rain": 30, "aqi": 170, "desc": "Heavy Rain"},
    "Ahmedabad":   {"temp": 41, "rain": 0,  "aqi": 190, "desc": "Extreme Heat"},
}

def compute_risk_from_weather(temp: float, rain: float, aqi: float) -> dict:
    """Convert raw weather data into risk scores for the ML model."""
    # Temperature risk (above 38°C is dangerous for outdoor workers)
    temp_risk = min(max((temp - 25) / 20, 0), 1)

    # Rain risk (above 50mm is very heavy)
    rain_risk = min(rain / 60, 1)

    # AQI risk (above 300 is hazardous)
    aqi_risk = min(max((aqi - 50) / 350, 0), 1)

    # Combined weather severity
    weather_severity = round(min(0.4 * temp_risk + 0.4 * rain_risk + 0.2 * aqi_risk, 1.0), 3)

    return {
        "temp_celsius": round(temp, 1),
        "rain_mm": round(rain, 1),
        "aqi": round(aqi),
        "temp_risk": round(temp_risk, 3),
        "rain_risk": round(rain_risk, 3),
        "aqi_risk": round(aqi_risk, 3),
        "weather_severity": weather_severity,
    }


@router.get("/city/{city}")
async def get_city_weather(city: str):
    """Fetch live weather for a city and return risk scores."""
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            # Fetch current weather
            weather_resp = await client.get(WEATHER_URL, params={
                "q": f"{city},IN",
                "appid": API_KEY,
                "units": "metric"
            })
            weather_resp.raise_for_status()
            w = weather_resp.json()

            temp = w["main"]["temp"]
            rain = w.get("rain", {}).get("1h", 0) * 10  # convert to mm approximation
            lat  = w["coord"]["lat"]
            lon  = w["coord"]["lon"]
            desc = w["weather"][0]["description"].title()
            humidity = w["main"]["humidity"]
            wind_speed = w["wind"]["speed"]

            # Fetch AQI
            aqi_resp = await client.get(AQI_URL, params={
                "lat": lat, "lon": lon, "appid": API_KEY
            })
            aqi_resp.raise_for_status()
            aqi_data = aqi_resp.json()
            # OWM AQI index 1-5, convert to 0-500 scale
            aqi_index = aqi_data["list"][0]["main"]["aqi"]
            aqi_value = [50, 100, 150, 250, 350][aqi_index - 1]
            pm25 = round(aqi_data["list"][0]["components"].get("pm2_5", 0), 1)

        risk = compute_risk_from_weather(temp, rain, aqi_value)

        return {
            "source": "live",
            "city": city,
            "description": desc,
            "humidity": humidity,
            "wind_speed": wind_speed,
            "pm25": pm25,
            **risk,
            "disruption_advice": _get_disruption_advice(risk["weather_severity"]),
        }

    except Exception as e:
        # Fallback to mock data
        mock = MOCK_WEATHER.get(city, {"temp": 32, "rain": 10, "aqi": 120, "desc": "Partly Cloudy"})
        risk = compute_risk_from_weather(mock["temp"], mock["rain"], mock["aqi"])
        return {
            "source": "mock",
            "city": city,
            "description": mock["desc"],
            "humidity": 65,
            "wind_speed": 12,
            "pm25": round(mock["aqi"] * 0.3, 1),
            **risk,
            "disruption_advice": _get_disruption_advice(risk["weather_severity"]),
            "note": f"Live API unavailable, using mock data. Error: {str(e)[:60]}"
        }


def _get_disruption_advice(severity: float) -> str:
    if severity >= 0.7:
        return "HIGH RISK — Severe conditions. Claim likely if you cannot work."
    elif severity >= 0.4:
        return "MEDIUM RISK — Conditions may affect work. Monitor closely."
    else:
        return "LOW RISK — Conditions are manageable for outdoor work."
