// 1. إعدادات Firebase (اطلبي من فرح تجيبهم من الـ Firebase Console تبعها)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_ID",
  appId: "YOUR_APP_ID"
};

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const formEl = document.querySelector("#purchase-form");
const loadingEl = document.querySelector("#loading");
const resultEl = document.querySelector("#result");

window.addEventListener("load", () => {
  document.getElementById("year").textContent = new Date().getFullYear();
});

formEl.addEventListener("submit", event => {
  event.preventDefault();

  const formData = new FormData(formEl);
  const data = Object.fromEntries(formData);

  // التأكد من أنواع البيانات وتوحيد حالة الأحرف لضمان دقة الموديل
  data.hour = Number(data.hour);
  data.day_of_week = Number(data.day_of_week);
  data.main_category = data.main_category.toLowerCase();
  data.brand = data.brand.toLowerCase();

  loadingEl.style.display = "block";
  resultEl.style.display = "none";
  resultEl.innerHTML = "";

  // إرسال البيانات للموديل (الـ Backend تبعك)
  fetch("https://roawiah-ai-backend.onrender.com/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
  .then(response => response.json())
  .then(result => {
    loadingEl.style.display = "none";
    resultEl.style.display = "block";

    const probability = result.probability ? Math.round(result.probability * 100) : 0;
    const message = result.message || "Safe to proceed.";

    // --- التعديل الجوهري: تخزين العملية في Firestore للداشبورد ---
    db.collection("analyses").add({
      product_name: data.product_name,
      category: data.main_category,
      brand: data.brand,
      hour: data.hour,
      day_of_week: data.day_of_week,
      is_emotional: result.is_emotional,
      probability: probability,
      timestamp: firebase.firestore.FieldValue.serverTimestamp() // مهم جداً للترتيب الزمني في الداشبورد
    })
    .then(() => console.log("✅ Data saved to Dashboard successfully!"))
    .catch((error) => console.error("❌ Error saving to Dashboard: ", error));

    // عرض النتيجة للمستخدم
    if (result.is_emotional) {
      resultEl.innerHTML = `
        <div style="background:#fff3cd; color:#856404; padding:20px; border-radius:15px; border:2px solid #ffe082; text-align:center;">
          <h2>⚠️ Emotional Purchase Detected</h2>
          <p><strong>Risk Level:</strong> ${probability}%</p>
          <p style="margin-top:10px; font-style:italic;">"${message}"</p>
        </div>`;
    } else {
      resultEl.innerHTML = `
        <div style="background:#e8f5e9; color:#1b5e20; padding:20px; border-radius:15px; border:2px solid #a5d6a7; text-align:center;">
          <h2>✅ Smart Purchase</h2>
          <p><strong>Confidence:</strong> ${probability}%</p>
          <p>Looks like a rational decision!</p>
        </div>`;
    }
  })
  .catch(error => {
    loadingEl.style.display = "none";
    resultEl.style.display = "block";
    resultEl.innerHTML = `<p style="color:#b00020; font-weight:bold;">Error connecting to the AI engine. Please try again.</p>`;
    console.error("Error:", error);
  });
});
