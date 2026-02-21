(function () {
  'use strict';

  // URL de l'Azure Function Missions (avec ?code=xxx si authLevel: function)
  const MISSIONS_FUNCTION_URL = 'https://abdelfunct-fze8exdpcbb9cqdh.westeurope-01.azurewebsites.net/api/mission-1?code=r7M_QMEPX-GMfSiccM7ohQAdHnMGkQn0NywMS1K7rY0iAzFuKN4N7w==';

  const apiUrlDisplay = document.getElementById('api-url-display');

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  if (apiUrlDisplay) apiUrlDisplay.textContent = MISSIONS_FUNCTION_URL;

  // ----- Missions (Azure Function) -----
  var missionsSkillsInput = document.getElementById('missions-skills');
  var missionsSearchBtn = document.getElementById('missions-search-btn');
  var missionsLoading = document.getElementById('missions-loading');
  var missionsError = document.getElementById('missions-error');
  var missionsEmpty = document.getElementById('missions-empty');
  var missionsList = document.getElementById('missions-list');

  if (missionsSearchBtn && missionsSkillsInput) {
    missionsSearchBtn.addEventListener('click', function () {
      var raw = (missionsSkillsInput.value || '').trim();
      var skills = raw.split(',').map(function (s) { return s.trim(); }).filter(Boolean);

      if (skills.length === 0) {
        missionsList.hidden = true;
        missionsLoading.hidden = true;
        missionsError.hidden = false;
        missionsError.textContent = 'Veuillez saisir au moins une compétence.';
        missionsEmpty.hidden = true;
        return;
      }

      missionsLoading.hidden = false;
      missionsError.hidden = true;
      missionsEmpty.hidden = true;
      missionsList.hidden = true;

      fetch(MISSIONS_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills: skills })
      })
        .then(function (res) {
          return res.json().then(function (data) {
            if (!res.ok) throw new Error(data.error || data.message || 'Erreur ' + res.status);
            return Array.isArray(data) ? data : (data.body || data.data || []);
          });
        })
        .then(function (missions) {
          missionsLoading.hidden = true;
          missionsError.hidden = true;
          if (!missions || missions.length === 0) {
            missionsEmpty.hidden = false;
            missionsEmpty.textContent = 'Aucune mission ne correspond à au moins 2 de vos compétences.';
            return;
          }
          missionsEmpty.hidden = true;
          missionsList.innerHTML = '';
          missions.forEach(function (m) {
            var card = document.createElement('article');
            card.className = 'mission-card';
            var skillsList = (m.requiredSkills || []).join(', ');
            card.innerHTML =
              '<h3 class="mission-name">' + escapeHtml(m.name || 'Mission') + '</h3>' +
              '<p class="mission-skills"><strong>Compétences :</strong> ' + escapeHtml(skillsList) + '</p>';
            missionsList.appendChild(card);
          });
          missionsList.hidden = false;
        })
        .catch(function (err) {
          missionsLoading.hidden = true;
          missionsEmpty.hidden = true;
          missionsError.textContent = err.message || 'Erreur réseau.';
          missionsError.hidden = false;
        });
    });
  }
})();
