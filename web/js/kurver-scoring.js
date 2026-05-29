(function () {
    'use strict';

    var TOTAL_ROUNDS = 10;
    var WIN_PTS      = 5;

    var pts        = {};   // { avatarId: { name, color, points } }
    var roundCount = 0;
    var repo       = null;
    var done       = false;

    function el(id) { return document.getElementById(id); }

    function render() {
        var overlay = el('kurver-score');
        var rows    = el('kurver-score-rows');
        var label   = el('kurver-score-match');
        if (!overlay || !rows || !label) return;

        var sorted = Object.keys(pts).map(function (id) { return pts[id]; })
            .sort(function (a, b) { return b.points - a.points; });

        rows.innerHTML = sorted.map(function (p) {
            return '<div class="ks-row">' +
                '<div class="ks-dot" style="background:' + p.color + '"></div>' +
                '<div class="ks-name">' + p.name + '</div>' +
                '<div class="ks-pts">' + p.points + '</div>' +
            '</div>';
        }).join('');

        if (done) {
            var top = sorted[0] && sorted[1] && sorted[0].points === sorted[1].points;
            label.textContent = top ? 'TIEBREAKER!' : 'GAME OVER';
        } else {
            label.textContent = 'Round ' + roundCount + ' / ' + TOTAL_ROUNDS;
        }

        overlay.style.display = 'block';
    }

    function seedPlayers() {
        if (!repo || !repo.game) return;
        repo.game.avatars.items.forEach(function (av) {
            if (!pts[av.id]) {
                pts[av.id] = { name: av.name, color: av.color, points: 0 };
            }
        });
    }

    function onRoundNew() {
        seedPlayers();
        render();
    }

    function onRoundEnd() {
        seedPlayers();
        roundCount++;
        var winner = repo.game && repo.game.roundWinner;
        if (winner && pts[winner.id]) {
            pts[winner.id].points += WIN_PTS;
        }
        if (roundCount >= TOTAL_ROUNDS) done = true;
        render();
    }

    function onGameEnd() {
        render();
        // Reset for the next game session
        pts        = {};
        roundCount = 0;
        done       = false;
    }

    function attach(gameRepo) {
        repo = gameRepo;
        repo.on('round:new', onRoundNew);
        repo.on('round:end', onRoundEnd);
        repo.on('end',       onGameEnd);
    }

    // Poll until Angular is bootstrapped and GameRepository is available
    var attempts = 0;
    var timer = setInterval(function () {
        attempts++;
        try {
            var injector = angular.element(document.body).injector();
            if (injector) {
                var gameRepo = injector.get('GameRepository');
                if (gameRepo) {
                    clearInterval(timer);
                    attach(gameRepo);
                    return;
                }
            }
        } catch (e) { /* not ready yet */ }
        if (attempts > 100) clearInterval(timer);
    }, 200);
})();
