"""
Train a sepsis risk model and save as model.pkl
Run: python train.py
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, roc_auc_score
import joblib
import os

FEATURE_NAMES = [
    "heartRate", "temp", "respRate", "sysBP", "o2Sat",
    "wbc", "lactate", "creatinine", "platelets",
    "age", "recentSurgery", "chronicDisease",
    "shortnessBreath", "difficultyBreathing", "abdominalPain",
    "fever", "confusion", "decreasedAppetite",
]

def generate_synthetic_data(n=2000):
    """Generate synthetic sepsis training data based on clinical criteria."""
    np.random.seed(42)
    data = []
    for _ in range(n):
        sepsis = np.random.random() < 0.35  # 35% positive class

        if sepsis:
            hr = np.random.normal(115, 20)
            temp = np.random.choice([
                np.random.normal(39.2, 0.8),
                np.random.normal(35.5, 0.5)
            ])
            rr = np.random.normal(26, 5)
            sbp = np.random.normal(88, 15)
            o2 = np.random.normal(90, 5)
            wbc = np.random.choice([
                np.random.normal(16, 4),
                np.random.normal(2.5, 1)
            ])
            lactate = np.random.normal(3.5, 1.5)
            creatinine = np.random.normal(2.2, 1.0)
            platelets = np.random.normal(100, 50)
            age = np.random.normal(65, 18)
            surgery = np.random.random() < 0.4
            chronic = np.random.random() < 0.6
            sob = np.random.random() < 0.75
            diff_breath = np.random.random() < 0.65
            abd_pain = np.random.random() < 0.45
            fever = np.random.random() < 0.70
            confusion = np.random.random() < 0.50
            appetite = np.random.random() < 0.55
        else:
            hr = np.random.normal(78, 12)
            temp = np.random.normal(37.0, 0.5)
            rr = np.random.normal(15, 3)
            sbp = np.random.normal(125, 15)
            o2 = np.random.normal(97, 2)
            wbc = np.random.normal(8, 2)
            lactate = np.random.normal(1.0, 0.4)
            creatinine = np.random.normal(0.9, 0.3)
            platelets = np.random.normal(250, 60)
            age = np.random.normal(45, 20)
            surgery = np.random.random() < 0.1
            chronic = np.random.random() < 0.2
            sob = np.random.random() < 0.15
            diff_breath = np.random.random() < 0.10
            abd_pain = np.random.random() < 0.10
            fever = np.random.random() < 0.15
            confusion = np.random.random() < 0.05
            appetite = np.random.random() < 0.15

        data.append([
            max(30, min(250, hr)),
            max(30, min(45, temp)),
            max(5, min(60, rr)),
            max(50, min(250, sbp)),
            max(50, min(100, o2)),
            max(0.5, min(50, wbc)),
            max(0.1, min(20, lactate)),
            max(0.3, min(15, creatinine)),
            max(10, min(800, platelets)),
            max(1, min(110, age)),
            int(surgery), int(chronic),
            int(sob), int(diff_breath), int(abd_pain),
            int(fever), int(confusion), int(appetite),
            int(sepsis),
        ])

    cols = FEATURE_NAMES + ["sepsis"]
    return pd.DataFrame(data, columns=cols)

def train():
    print("Generating synthetic training data...")
    df = generate_synthetic_data(3000)

    X = df[FEATURE_NAMES]
    y = df["sepsis"]

    print(f"Dataset: {len(df)} samples, {y.mean():.1%} positive")

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    # Random Forest (no scaling needed)
    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=10,
        min_samples_leaf=5,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]

    print("\n── Model Evaluation ──")
    print(classification_report(y_test, y_pred, target_names=["No Sepsis", "Sepsis"]))
    print(f"ROC-AUC: {roc_auc_score(y_test, y_proba):.4f}")

    # Feature importance
    print("\n── Top Feature Importances ──")
    imp = sorted(zip(FEATURE_NAMES, model.feature_importances_), key=lambda x: -x[1])
    for name, score in imp[:8]:
        print(f"  {name:20s}: {score:.4f}")

    # Save
    out_path = os.path.join(os.path.dirname(__file__), "model.pkl")
    joblib.dump({"model": model, "feature_names": FEATURE_NAMES}, out_path)
    print(f"\n✅ Model saved to {out_path}")

if __name__ == "__main__":
    train()
