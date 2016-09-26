(function() {
  'use strict';

  const board = document.getElementById('board');
  if (!board) {
    return;
  }

  const pointsRegEx = /^\(([\d\.]+)\)(.+)/;
  const tagsRegEx = /^\s*(\[.+\])(.+)/;
  const listTotalPointsClassName = 'trello-story-points-list-total';
  const cardStoryPointsClassName = 'trello-story-points-card-points';
  const cardTagsClassName = 'trello-story-points-card-tags';
  const cardTextClassName = 'trello-story-points-card-title';

  const debounce = function (wait, func, immediate) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  };

  const stringToColor = (str) => {
    const s = str.toLowerCase();
    let hash = 0;
    let chr;
    let len;

    for (let i = 0, len = s.length; i < len; i++) {
      chr   = s.charCodeAt(i);
      hash  = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }

    return `hsla(${hash % 256}, 50%, 75%, 1)`;
  };

  const update = debounce(200, () => {
    // Stop update
    board.removeEventListener('DOMSubtreeModified', update);

    // Restore pristine conditions
    Array
      .from(document.getElementsByClassName(listTotalPointsClassName))
      .forEach(element => element.remove());

    Array
      .from(board.getElementsByClassName('list-cards'))
      .forEach(listCards => {
        const listTotalPoints = Array
          .from(listCards.getElementsByClassName('list-card'))
          .map(card => {
            // Card is a textbox to add new cards
            if (
              card.classList.contains('js-composer') ||
              card.classList.contains('placeholder')
            ) {
              return 0;
            }
            const cardTitleEl = card.getElementsByClassName('list-card-title')[0];
            const cardPointsEl = (
              card.getElementsByClassName(cardStoryPointsClassName)[0] ||
              document.createElement('span')
            );
            const cardTagsEl = (
              card.getElementsByClassName(cardTagsClassName)[0] ||
              document.createElement('ul')
            );
            let cardTextEl = card.getElementsByClassName(cardTextClassName)[0];
            if (!cardTextEl) {
              cardTextEl = document.createElement('span');
              cardTextEl.innerText = cardTitleEl.innerText;
              cardTextEl.className = cardTextClassName;
            }
            let cardTitle = cardTextEl.innerText;

            // Points
            let cardPoints = cardPointsEl.innerText;
            if (!cardPoints) {
              const pointsRes = pointsRegEx.exec(cardTitle);
              if (pointsRes && pointsRes.length > 2) {
                cardTitle = pointsRes[2];
                cardPoints = pointsRes[1];
                cardPointsEl.innerText = cardPoints;
                cardPointsEl.className = cardStoryPointsClassName;
              }
            }
            cardPoints = parseFloat(cardPoints);
            // Tags
            let cardTags;
            if (!cardTagsEl.innerText) {
              const tagsRes = tagsRegEx.exec(cardTitle);
              if (tagsRes && tagsRes.length > 2) {
                cardTitle = tagsRes[2];
                cardTags = tagsRes[1]
                  .split(']')
                  .filter(t => t)
                  .map(t => t.trim().substr(1).trim());
                cardTagsEl.className = cardTagsClassName;
                cardTagsEl.innerHTML = cardTags
                .map(t => `<li style="background-color:${stringToColor(t)}">${t}</li>`)
                .join('');
              }
            }
            // Compose card title
            const children = Array.from(cardTitleEl.children);
            cardTitleEl.innerText = '';
            for (let c of children) {
              cardTitleEl.appendChild(c);
            }
            if (cardPoints > 0) {
              cardTitleEl.appendChild(cardPointsEl);
            }
            if (cardTags && cardTags.length > 0) {
              cardTitleEl.appendChild(cardTagsEl);
            }
            cardTextEl.innerText = cardTitle;
            cardTitleEl.appendChild(cardTextEl);
            // Return points
            return cardPoints || 0;
          })
          .reduce((sum, p) => sum + p, 0);

        const listTotal = document.createElement('div');
        listTotal.className = listTotalPointsClassName;
        listTotal.innerText = listTotalPoints;
        // TODO add this to the header
        listCards.parentNode.insertBefore(listTotal, listCards);
      });

    // Restore update
    board.addEventListener('DOMSubtreeModified', update);
  });

  // Start
  update();

} ());