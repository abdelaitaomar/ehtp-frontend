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
    card.setAttribute('data-match-id', match.id);

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

    var actions = '<div class="match-actions">' +
      '<button type="button" class="btn-match btn-edit" data-match-id="' + escapeHtml(match.id) + '" aria-label="Modifier">Modifier</button>' +
      '<button type="button" class="btn-match btn-delete" data-match-id="' + escapeHtml(match.id) + '" aria-label="Supprimer">Supprimer</button>' +
      '</div>';

    card.innerHTML =
      '<span class="team">' + escapeHtml(match.home) + '</span>' +
      '<span class="score">' + (match.homeScore != null ? match.homeScore : '-') + ' - ' + (match.awayScore != null ? match.awayScore : '-') + '</span>' +
      '<span class="team">' + escapeHtml(match.away) + '</span>' +
      meta +
      actions;

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
    attachMatchActions(container);
  }

  function attachMatchActions(container) {
    container.querySelectorAll('.btn-edit').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-match-id');
        openEditDialog(id);
      });
    });
    container.querySelectorAll('.btn-delete').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-match-id');
        deleteMatch(id);
      });
    });
  }

  function openEditDialog(matchId) {
    fetch(API_BASE + '/api/matches')
      .then(function (res) { return res.json(); })
      .then(function (json) {
        var list = json && json.data ? json.data : [];
        var match = list.find(function (m) { return m.id === matchId; });
        if (!match) return;
        formAdd.querySelector('[name="home"]').value = match.home || '';
        formAdd.querySelector('[name="away"]').value = match.away || '';
        formAdd.querySelector('[name="homeScore"]').value = match.homeScore != null ? match.homeScore : 0;
        formAdd.querySelector('[name="awayScore"]').value = match.awayScore != null ? match.awayScore : 0;
        formAdd.querySelector('[name="status"]').value = match.status || 'live';
        formAdd.querySelector('[name="minute"]').value = match.minute != null ? match.minute : 0;
        formAdd.querySelector('[name="competition"]').value = match.competition || '';
        formAdd.setAttribute('data-edit-id', matchId);
        var title = document.getElementById('dialog-title');
        var submitBtn = formAdd.querySelector('.btn-submit');
        if (title) title.textContent = 'Modifier le match';
        if (submitBtn) submitBtn.textContent = 'Enregistrer';
        formError.hidden = true;
        dialog.showModal();
      })
      .catch(function () {
        formError.textContent = 'Impossible de charger le match.';
        formError.hidden = false;
        dialog.showModal();
      });
  }

  function deleteMatch(matchId) {
    if (!confirm('Supprimer ce match ?')) return;
    fetch(API_BASE + '/api/matches/' + matchId, { method: 'DELETE' })
      .then(function (res) {
        if (!res.ok) throw new Error('Erreur ' + res.status);
        return res.json();
      })
      .then(function () {
        fetchLive();
        fetchResults();
      })
      .catch(function (err) {
        alert(err.message || 'Erreur lors de la suppression.');
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

  // ----- Dialog Ajouter un match -----
  var dialog = document.getElementById('dialog-add-match');
  var btnOpen = document.getElementById('btn-open-dialog');
  var btnClose = document.getElementById('btn-close-dialog');
  var formAdd = document.getElementById('form-add-match');
  var formError = document.getElementById('form-add-error');

  if (btnOpen && dialog) {
    btnOpen.addEventListener('click', function () {
      formAdd.removeAttribute('data-edit-id');
      formAdd.reset();
      var title = document.getElementById('dialog-title');
      var submitBtn = formAdd.querySelector('.btn-submit');
      if (title) title.textContent = 'Nouveau match';
      if (submitBtn) submitBtn.textContent = 'Ajouter le match';
      dialog.showModal();
      formError.hidden = true;
    });
  }

  if (btnClose && dialog) {
    btnClose.addEventListener('click', function () {
      dialog.close();
    });
  }

  if (dialog) {
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) dialog.close();
    });
  }

  if (formAdd) {
    formAdd.addEventListener('submit', function (e) {
      e.preventDefault();
      formError.hidden = true;

      var fd = new FormData(formAdd);
      var home = (fd.get('home') || '').trim();
      var away = (fd.get('away') || '').trim();
      var homeScore = parseInt(fd.get('homeScore'), 10) || 0;
      var awayScore = parseInt(fd.get('awayScore'), 10) || 0;
      var status = fd.get('status') || 'live';
      var minute = parseInt(fd.get('minute'), 10) || 0;
      var competition = (fd.get('competition') || '').trim();

      if (!home || !away) {
        formError.textContent = 'Veuillez remplir les équipes domicile et extérieur.';
        formError.hidden = false;
        return;
      }

      var submitBtn = formAdd.querySelector('.btn-submit');
      if (submitBtn) {
        submitBtn.disabled = true;
      }

      var editId = formAdd.getAttribute('data-edit-id');
      var url = editId ? API_BASE + '/api/matches/' + editId : API_BASE + '/api/matches';
      var method = editId ? 'PUT' : 'POST';

      fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          home: home,
          away: away,
          homeScore: homeScore,
          awayScore: awayScore,
          status: status,
          minute: minute,
          competition: competition
        })
      })
        .then(function (res) {
          return res.json().then(function (json) {
            if (!res.ok) throw new Error(json.error || 'Erreur ' + res.status);
            return json;
          });
        })
        .then(function () {
          dialog.close();
          formAdd.removeAttribute('data-edit-id');
          formAdd.reset();
          var title = document.getElementById('dialog-title');
          var submitLabel = formAdd.querySelector('.btn-submit');
          if (title) title.textContent = 'Nouveau match';
          if (submitLabel) submitLabel.textContent = 'Ajouter le match';
          fetchLive();
          fetchResults();
        })
        .catch(function (err) {
          formError.textContent = err.message || 'Erreur réseau.';
          formError.hidden = false;
        })
        .finally(function () {
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  }
})();
