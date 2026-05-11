from typing import Dict, List

class TreatmentService:
    # Bio-matcher logic inspired by AgriTech (omroy07)
    BIO_MATCHER = {
        "Aphids": "Release Ladybugs (Coccinellidae) or use Neem Oil spray.",
        "Mites": "Deploy Predatory Mites or spray with water to increase humidity.",
        "Caterpillar": "Use Bacillus thuringiensis (Bt) or manual removal.",
        "Whitefly": "Deploy Encarsia formosa wasps or use yellow sticky traps.",
        "Thrips": "Use Blue sticky traps or apply Spinosad-based organic spray.",
    }

    # Disease treatment logic
    DISEASE_TREATMENTS = {
        "Late Blight": "Remove infected leaves and apply Copper-based fungicide. Ensure good air circulation.",
        "Early Blight": "Remove lower leaves to prevent soil splash and apply organic fungicides.",
        "Apple Scab": "Prune infected branches and apply sulfur or lime-sulfur sprays during dormancy.",
        "Apple Rust": "Remove nearby Cedar trees (alternate host) and use Myclobutanil fungicides.",
        "Corn Leaf Blight": "Rotate crops and apply foliar fungicides if severity is high.",
        "Tomato Mosaic Virus": "Remove and destroy infected plants immediately. Disinfect tools.",
        "Rice Blast": "Avoid excessive nitrogen fertilization and use resistant varieties.",
        "Tikka Disease": "Apply Carbendazim (0.1%) or Mancozeb (0.2%) fungicide. Rotate crops to break the cycle.",
        "Leaf Spot": "Improve plant spacing for better airflow and apply Chlorothalonil or organic sulfur sprays.",
        "Healthy": "No treatment required. Maintain current irrigation and fertilization schedule.",
    }

    @staticmethod
    def get_suggested_treatment(disease_name: str) -> str:
        if not disease_name:
            return "No specific treatment identified. Consult an expert for further analysis."
        
        # Check Bio-matcher first (pests)
        for pest, treatment in TreatmentService.BIO_MATCHER.items():
            if pest.lower() in disease_name.lower():
                return f"Biological Control: {treatment}"
        
        # Check Disease treatments
        for disease, treatment in TreatmentService.DISEASE_TREATMENTS.items():
            if disease.lower() in disease_name.lower():
                return treatment
                
        return "General Advisory: Maintain optimal soil health and monitor for spreading. Consult an expert if symptoms persist."

treatment_service = TreatmentService()
