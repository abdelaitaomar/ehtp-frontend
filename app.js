(function () {
  'use strict';

  // URL de votre backend — Azure ou en local (ex: http://localhost:8080)
  const API_BASE = 'https://backservce-c0guhkfxa6cfa2bk.westeurope-01.azurewebsites.net/';

  const liveContainer = document.getElementById('live-matches');
  const liveLoading = document.getElementById('live-loading');
  const liveError = document.getElementById('live-error');
  const liveEmpty = document.getElementById('live-empty');

  const resultsContainer = document.getElementById('results-matches');
  const resultsLoading = document.getElementById('results-loading');
  const resultsError = document.getElementById('results-error');
  const resultsEmpty = document.getElementById('results-empty');

  const apiUrlDisplay = document.getElementById('api-url-display');

  function hideAll(container, except) {
    var children = container.querySelectorAll('[id]');
    children.forEach(function (el) {
      if (el.id && el.id !== except) {
        el.hidden = true;
      }
    });
  }

  function show(el) {
    if (el) el.hidden = false;
  }

  function createMatchCard(match, isLive) {
    var card = document.createElement('article');
    card.className = 'match-card' + (isLive ? ' live' : '');
    card.setAttribute('role', 'listitem');

    var meta = '';
    if (isLive && match.minute != null) {
      meta = '<span class="minute">' + escapeHtml(match.minute) + "'</span>";
    }
    if (match.competition) {
      meta += (meta ? ' · ' : '') + '<span class="competition">' + escapeHtml(match.competition) + '</span>';
    }
    if (meta) {
      meta = '<div class="meta">' + meta + '</div>';
    }

    card.innerHTML =
      '<span class="team">' + escapeHtml(match.home) + '</span>' +
      '<span class="score">' + (match.homeScore != null ? match.homeScore : '-') + ' - ' + (match.awayScore != null ? match.awayScore : '-') + '</span>' +
      '<span class="team">' + escapeHtml(match.away) + '</span>' +
      meta;

    return card;
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function renderList(container, list, loadingEl, errorEl, emptyEl, isLive) {
    hideAll(container);
    loadingEl.hidden = true;

    if (list === null) {
      show(errorEl);
      return;
    }

    if (list.length === 0) {
      show(emptyEl);
      return;
    }

    container.querySelectorAll('.match-card').forEach(function (el) {
      el.remove();
    });
    list.forEach(function (match) {
      container.appendChild(createMatchCard(match, isLive));
    });
  }

  function fetchLive() {
    show(liveLoading);
    fetch(API_BASE + '/api/matches/live', { method: 'GET' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (json) {
        var data = json && json.data ? json.data : [];
        renderList(liveContainer, data, liveLoading, liveError, liveEmpty, true);
      })
      .catch(function (err) {
        liveError.textContent = 'Erreur : ' + (err.message || 'réseau');
        renderList(liveContainer, null, liveLoading, liveError, liveEmpty, true);
      });
  }

  function fetchResults() {
    show(resultsLoading);
    fetch(API_BASE + '/api/matches/results', { method: 'GET' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (json) {
        var data = json && json.data ? json.data : [];
        renderList(resultsContainer, data, resultsLoading, resultsError, resultsEmpty, false);
      })
      .catch(function (err) {
        resultsError.textContent = 'Erreur : ' + (err.message || 'réseau');
        renderList(resultsContainer, null, resultsLoading, resultsError, resultsEmpty, false);
      });
  }

  apiUrlDisplay.textContent = API_BASE;

  fetchLive();
  fetchResults();

  // Rafraîchir les matchs live toutes les 30 secondes
  setInterval(fetchLive, 30000);
})();
