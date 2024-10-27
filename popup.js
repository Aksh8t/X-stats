document.addEventListener("DOMContentLoaded", () => {
  loadData();
  document.getElementById("timeRange").addEventListener("change", loadData);
});

async function loadData() {
  try {
    const { sessionData, usageData } = await chrome.storage.local.get([
      "sessionData",
      "usageData",
    ]);
    const timeRange = parseInt(document.getElementById("timeRange").value);
    const filteredData = filterDataByDays(sessionData || [], timeRange);

    displayQuickStats(filteredData);
    createUsageChart(filteredData);
    createTopicsChart(usageData || []);
    displayRecentSessions(filteredData);
    displayTopicCloud(usageData || []);
    displayProductivityMetrics(filteredData);
  } catch (error) {
    console.error("Error loading data:", error);
  }
}

function filterDataByDays(data, days) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return data.filter((item) => item.start >= cutoff);
}

function displayQuickStats(data) {
  const stats = {
    totalSessions: data.length,
    avgDuration:
      data.reduce((sum, session) => sum + session.duration, 0) /
      data.length /
      60,
    totalMessages: data.reduce((sum, session) => sum + session.messageCount, 0),
    avgProductivity:
      data.reduce((sum, session) => sum + (session.productivity || 0), 0) /
      data.length,
  };

  document.getElementById("quick-stats").innerHTML = `
      <div class="stat-item">
          <div class="stat-value">${stats.totalSessions}</div>
          <div class="stat-label">Sessions</div>
      </div>
      <div class="stat-item">
          <div class="stat-value">${stats.avgDuration.toFixed(1)}</div>
          <div class="stat-label">Avg Minutes</div>
      </div>
      <div class="stat-item">
          <div class="stat-value">${stats.totalMessages}</div>
          <div class="stat-label">Messages</div>
      </div>
      <div class="stat-item">
          <div class="stat-value">${stats.avgProductivity.toFixed(1)}</div>
          <div class="stat-label">Msgs/Min</div>
      </div>
  `;
}

function createUsageChart(data) {
  const ctx = document.getElementById("usageChart").getContext("2d");
  const dailyData = aggregateDataByDay(data);

  new Chart(ctx, {
    type: "line",
    data: {
      labels: dailyData.map((d) => d.date),
      datasets: [
        {
          label: "Usage Duration (minutes)",
          data: dailyData.map((d) => d.duration / 60),
          borderColor: "rgb(75, 192, 192)",
          backgroundColor: "rgba(75, 192, 192, 0.1)",
          tension: 0.1,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Minutes",
          },
        },
      },
    },
  });
}
// Function to aggregate data by day
function aggregateDataByDay(data) {
  // Create an object to store aggregated data by date
  const aggregatedByDay = {};

  // Iterate through the data and aggregate by day
  data.forEach((item) => {
    // Convert timestamp to date string (YYYY-MM-DD)
    const date = new Date(item.start).toISOString().split("T")[0];

    if (!aggregatedByDay[date]) {
      aggregatedByDay[date] = {
        date: date,
        count: 0,
        totalTokens: 0,
        totalTime: 0,
        sessions: [],
      };
    }

    // Aggregate metrics
    aggregatedByDay[date].count++;
    aggregatedByDay[date].totalTokens += item.tokens || 0;
    aggregatedByDay[date].totalTime += item.duration || 0;
    aggregatedByDay[date].sessions.push(item);
  });

  // Convert to array and sort by date
  return Object.values(aggregatedByDay).sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
}
// Add these functions to your popup.js

function initializeCharts(data) {
  const filteredData = filterDataByDays(data, days);
  
  // Usage over time chart
  const usageCtx = document.getElementById('usageChart').getContext('2d');
  new Chart(usageCtx, {
      type: 'line',
      data: {
          labels: filteredData.map(item => new Date(item.start).toLocaleDateString()),
          datasets: [{
              label: 'Usage Sessions',
              data: filteredData.map(item => item.duration || 0),
              borderColor: 'rgb(75, 192, 192)',
              tension: 0.1
          }]
      },
      options: {
          responsive: true,
          scales: {
              y: {
                  beginAtZero: true,
                  title: {
                      display: true,
                      text: 'Duration (minutes)'
                  }
              }
          }
      }
  });

  // Productivity metrics chart
  const productivityCtx = document.getElementById('productivityChart').getContext('2d');
  new Chart(productivityCtx, {
      type: 'bar',
      data: {
          labels: filteredData.map(item => new Date(item.start).toLocaleDateString()),
          datasets: [{
              label: 'Tokens Used',
              data: filteredData.map(item => item.tokens || 0),
              backgroundColor: 'rgb(54, 162, 235)'
          }]
      },
      options: {
          responsive: true,
          scales: {
              y: {
                  beginAtZero: true,
                  title: {
                      display: true,
                      text: 'Tokens'
                  }
              }
          }
      }
  });
}

// Modify your existing loadData function
function loadData() {
  try {
      const filteredData = filterDataByDays(data, days);
      displayRecentSessions(filteredData);
      displayTopicCloud(usageData || []);
      displayProductivityMetrics(filteredData);
      
      // Initialize charts with the filtered data
      initializeCharts(filteredData);
  } catch (error) {
      console.error("Error loading data: ", error);
  }
}

// Helper function to calculate daily averages
function calculateDailyMetrics(aggregatedData) {
  return aggregatedData.map((day) => ({
    ...day,
    averageTokensPerSession:
      day.count > 0 ? Math.round(day.totalTokens / day.count) : 0,
    averageTimePerSession:
      day.count > 0 ? Math.round(day.totalTime / day.count) : 0,
  }));
}

// Add more functions for topics chart, recent sessions, etc.
function createTopicsChart(data) {
  const topics = {};
  data.forEach((item) => {
    if (item.topics) {
      item.topics.forEach((topic) => {
        topics[topic] = (topics[topic] || 0) + 1;
      });
    }
  });

  const ctx = document.getElementById("topicsChart").getContext("2d");
  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: Object.keys(topics),
      datasets: [
        {
          data: Object.values(topics),
          backgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#4BC0C0",
            "#9966FF",
            "#FF9F40",
            "#FF6384",
          ],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
        },
      },
    },
  });
}
