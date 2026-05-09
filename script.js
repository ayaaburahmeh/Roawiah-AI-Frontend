// استبدلي جزء الإرسال في ملف script.js بهذا الكود المحدث:

formEl.addEventListener("submit", event => {
  event.preventDefault();

  const formData = new FormData(formEl);
  const data = Object.fromEntries(formData);

  // تحويل المدخلات للأرقام المطلوبة للموديل
  data.hour = Number(data.hour);
  data.day_of_week = Number(data.day_of_week);

  // --- التعديل الهام: ضمان تطابق النصوص مع الموديل ---
  // نحول كل النصوص لأحرف صغيرة (lowercase) لأن الـ Encoder تدرب عليها هيك
  data.main_category = data.main_category.toLowerCase();
  data.brand = data.brand.toLowerCase();

  loadingEl.style.display = "block";
  resultEl.style.display = "none";
  resultEl.innerHTML = "";

  fetch("https://roawiah-ai-backend.onrender.com/predict", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  })
  .then(response => response.json())
  .then(result => {
      loadingEl.style.display = "none";
      resultEl.style.display = "block";

      const probability = result.probability ? Math.round(result.probability * 100) : 0;
      const message = result.message || "This purchase looks safe based on the available information.";

      if (result.is_emotional) {
        resultEl.innerHTML = `
          <div style="background:#fff3cd; color:#856404; padding:20px; border-radius:15px; border:2px solid #ffe082; text-align:center;">
            <h2>⚠️ Emotional Purchase Detected</h2>
            <p><strong>Risk Level:</strong> ${probability}%</p>
            <p style="margin-top:10px; font-style:italic;">"${message}"</p>
          </div>
        `;
      } else {
        resultEl.innerHTML = `
          <div style="background:#e8f5e9; color:#1b5e20; padding:20px; border-radius:15px; border:2px solid #a5d6a7; text-align:center;">
            <h2>✅ Smart Purchase</h2>
            <p><strong>Confidence:</strong> ${probability}%</p>
            <p style="margin-top:10px;">Safe to proceed!</p>
          </div>
        `;
      }
  })
  .catch(error => {
      loadingEl.style.display = "none";
      resultEl.style.display = "block";
      resultEl.innerHTML = `<p style="color:#b00020; font-weight:bold;">Server is starting up (Cold Start). Please wait 30 seconds and try again.</p>`;
      console.error("Error:", error);
  });
});
