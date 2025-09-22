document.addEventListener('DOMContentLoaded', async () => {
    try {
      // گرفتن داده‌های داشبورد
      const statsResponse = await fetch('/api/admin/stats'); 
      const stats = await statsResponse.json();
  
      document.getElementById('views').textContent = stats.views;
      document.getElementById('authors').textContent = stats.authors;
      document.getElementById('books').textContent = stats.books;
      document.getElementById('categories').textContent = stats.categories;
  
      // گرفتن داده‌های Activity Chart
      const activityResponse = await fetch('/api/admin/activity');
      const activityData = await activityResponse.json();
  
      // بررسی اینکه داده‌ها آرایه باشند
      const activityArray = Array.isArray(activityData) ? activityData : [];
      const labels = activityArray.map(d => d.month); 
      const values = activityArray.map(d => parseInt(d.total_views));
  
      const ctx = document.getElementById('activityChart').getContext('2d');
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Views',
            data: values,
            borderColor: '#67c0b9',
            backgroundColor: 'rgba(103,192,185,0.18)',
            tension: 0.3,
            fill: true,
            pointRadius: 3
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
            tooltip: { mode: 'index', intersect: false }
          },
          scales: {
            x: { grid: { display: false } },
            y: { beginAtZero: true }
          }
        }
      });
  
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    }
  });
  





