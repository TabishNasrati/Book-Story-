document.addEventListener('DOMContentLoaded', async () => {
  try {
    // ---------- المان‌ها ----------
    const viewsEl = document.getElementById('views');
    const authorsEl = document.getElementById('authors');
    const booksEl = document.getElementById('books');
    const categoriesEl = document.getElementById('categories');
    const chartEl = document.getElementById('activityChart');

    // ---------- گرفتن داده‌های داشبورد از API ----------
    let stats = {};
    try {
      const statsResponse = await fetch('/api/admin/stats'); // API واقعی
      stats = await statsResponse.json();
    } catch {
      stats = { views: 1200, authors: 5, books: 20, categories: 6 }; // fallback تست
    }

    if (viewsEl) viewsEl.textContent = stats.views ?? 0;
    if (authorsEl) authorsEl.textContent = stats.authors ?? 0;
    if (booksEl) booksEl.textContent = stats.books ?? 0;
    if (categoriesEl) categoriesEl.textContent = stats.categories ?? 0;

    // ---------- گرفتن داده‌های Activity Chart ----------
    let activityArray = [];
    try {
      const activityResponse = await fetch('/api/admin/activity'); // API واقعی
      const activityData = await activityResponse.json();
      activityArray = Array.isArray(activityData) ? activityData : [];
    } catch {
      activityArray = [
        { month: 'Jan', total_views: 1200},
        { month: 'Feb', total_views: 1900 },
        { month: 'Mar', total_views: 3000},
        { month: 'Apr', total_views: 2500},
        { month: 'May', total_views: 3200 },
        { month: 'Jun', total_views: 5000 }
      ];
    }

    const labels = activityArray.map(d => d.month);
    const values = activityArray.map(d => parseInt(d.total_views));

    // ---------- رسم نمودار ----------
    if (chartEl) {
      const ctx = chartEl.getContext('2d');
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels.length ? labels : ['Jan','Feb','Mar','Apr','May','Jun'],
          datasets: [{
            label: 'Views',
            data: values.length ? values : [1200,1900,3000,2500,3200,4000],
            borderColor: '#67c0b9',
            backgroundColor: 'rgba(103,192,185,0.18)',
            tension: 0.3,
            fill: true,
            pointRadius: 3
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
          scales: { x: { grid: { display: false } }, y: { beginAtZero: true } }
        }
      });
    }

  } catch (err) {
    console.error('Error loading dashboard data:', err);
  }

  // ---------- Highlight لینک فعال ----------
  document.querySelectorAll(".sidebar .nav-link").forEach(link => {
    if (link.href === window.location.href) link.classList.add("active");
  });
});
