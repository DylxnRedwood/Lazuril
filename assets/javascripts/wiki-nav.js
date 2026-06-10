(function () {
  const script = document.currentScript || document.getElementsByTagName('script').item(document.getElementsByTagName('script').length - 1);
  if (!script) return;

  // Derive site root from the current script location.
  const siteRoot = new URL('../..', script.src);

  const siteStructure = [
    {
      title: 'Arkhaven Lore',
      children: [
        { title: 'The Godscar', href: new URL('Worldbuilding/Arkhaven%20Lore/The%20Godscar/', siteRoot).href },
        { title: 'The Green Silence', href: new URL('Worldbuilding/Arkhaven%20Lore/The%20Green%20Silence/', siteRoot).href },
        { title: 'The Scriptor Compact', href: new URL('Worldbuilding/Arkhaven%20Lore/The%20Scriptor%20Compact/', siteRoot).href },
        { title: 'War of the False Saints', href: new URL('Worldbuilding/Arkhaven%20Lore/War%20of%20the%20False%20Saints/', siteRoot).href }
      ]
    },
    {
      title: 'Arkhaven States',
      children: [
        { title: 'States Overview', href: new URL('Worldbuilding/Arkhaven%20States/index.html', siteRoot).href },
        { title: 'Court of Thalóriel', href: new URL('Worldbuilding/Arkhaven%20States/Court%20of%20Thal%C3%B3riel/index.html', siteRoot).href },
        { title: 'Dornhal Empire', href: new URL('Worldbuilding/Arkhaven%20States/Dornhal%20Empire/index.html', siteRoot).href },
        { title: 'Haskarn Freeholds', href: new URL('Worldbuilding/Arkhaven%20States/Haskarn%20Freeholds/index.html', siteRoot).href },
        { title: 'Houses of Bârathanaear', href: new URL('Worldbuilding/Arkhaven%20States/Houses%20of%20B%C3%A2rathanaear/index.html', siteRoot).href },
        { title: 'Jhakur Clans', href: new URL('Worldbuilding/Arkhaven%20States/Jhakur%20Clans/index.html', siteRoot).href },
        { title: 'Kharad Wildlands', href: new URL('Worldbuilding/Arkhaven%20States/Kharad%20Wildlands/index.html', siteRoot).href },
        { title: 'Myruun Clans', href: new URL('Worldbuilding/Arkhaven%20States/Myruun%20Clans/index.html', siteRoot).href },
        { title: 'Republic of Havenor', href: new URL('Worldbuilding/Arkhaven%20States/Republic%20of%20Havenor/index.html', siteRoot).href },
        { title: 'The Eldermarch Court', href: new URL('Worldbuilding/Arkhaven%20States/The%20Eldermarch%20Court/index.html', siteRoot).href },
        { title: 'The Leridian Concord', href: new URL('Worldbuilding/Arkhaven%20States/The%20Leridian%20Concord/index.html', siteRoot).href },
        { title: 'The Martarië Crown', href: new URL('Worldbuilding/Arkhaven%20States/The%20Martari%C3%AB%20Crown/index.html', siteRoot).href },
        { title: 'The Skeldic Concord', href: new URL('Worldbuilding/Arkhaven%20States/The%20Skeldic%20Concord/index.html', siteRoot).href },
        { title: 'The Throne of Khuldovar', href: new URL('Worldbuilding/Arkhaven%20States/The%20Throne%20of%20Khuldovar/index.html', siteRoot).href },
        { title: 'The Verdant Confederacy', href: new URL('Worldbuilding/Arkhaven%20States/The%20Verdant%20Confederacy/index.html', siteRoot).href },
        { title: 'The Vermillion Crown', href: new URL('Worldbuilding/Arkhaven%20States/The%20Vermillion%20Crown/index.html', siteRoot).href },
        { title: 'Tirith I Daur', href: new URL('Worldbuilding/Arkhaven%20States/Tirith%20I%20Daur/index.html', siteRoot).href },
        { title: 'Veylrath Clans', href: new URL('Worldbuilding/Arkhaven%20States/Veylrath%20Clans/index.html', siteRoot).href },
        { title: 'Windmere Assembly', href: new URL('Worldbuilding/Arkhaven%20States/Windmere%20Assembly/index.html', siteRoot).href },
        { title: 'Zul’Akari Clans', href: new URL('Worldbuilding/Arkhaven%20States/Zul%E2%80%99Akari%20Clans/index.html', siteRoot).href }
      ]
    },
    {
      title: 'Continents',
      children: [
        { title: 'Arkhaven', href: new URL('Worldbuilding/Continents/Arkhaven/index.html', siteRoot).href }
      ]
    },
    {
      title: 'History',
      children: [
        { title: 'Ages of Lazuril', href: new URL('Worldbuilding/History/Ages%20of%20Lazuril/index.html', siteRoot).href },
        { title: 'Calendar System', href: new URL('Worldbuilding/History/Calendar%20System/index.html', siteRoot).href },
        { title: 'Timeline of Major Events', href: new URL('Worldbuilding/History/Timeline%20of%20Major%20Events/index.html', siteRoot).href }
      ]
    },
    {
      title: 'Occupations',
      children: [
        { title: 'Inquisitor-Scriptor', href: new URL('Worldbuilding/Occupations/Inquisitor-Scriptor/index.html', siteRoot).href }
      ]
    },
    {
      title: 'Races',
      children: [
        { title: 'Dwarves', href: new URL('Worldbuilding/Races/Dwarves/index.html', siteRoot).href },
        { title: 'Elves', href: new URL('Worldbuilding/Races/Elves/index.html', siteRoot).href },
        { title: 'Humans', href: new URL('Worldbuilding/Races/Humans/index.html', siteRoot).href },
        { title: 'Tabaxi', href: new URL('Worldbuilding/Races/Tabaxi/index.html', siteRoot).href }
      ]
    },
    {
      title: 'World',
      children: [
        { title: 'Lazuril', href: new URL('Worldbuilding/World/Lazuril/index.html', siteRoot).href }
      ]
    }
  ];

  function buildTopNav() {
    // Make the h1 clickable to homepage
    const h1 = document.querySelector('.torillic-header h1');
    if (h1) {
      const a = document.createElement('a');
      a.href = siteRoot.href;
      a.textContent = h1.textContent;
      a.style.color = 'inherit';
      a.style.textDecoration = 'none';
      h1.innerHTML = '';
      h1.appendChild(a);
    }

    const headerNav = document.querySelector('.torillic-header nav');
    if (!headerNav) return;

    headerNav.innerHTML = '';
    headerNav.classList.add('wiki-top-nav');

    siteStructure.forEach(section => {
      const item = document.createElement('div');
      item.className = 'top-nav-item';
      item.setAttribute('aria-expanded', 'false');

      if (section.children && section.children.length) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'top-nav-button';
        button.textContent = section.title;
        button.addEventListener('click', event => {
          event.stopPropagation();
          // close other open top-nav items
          document.querySelectorAll('.top-nav-item[aria-expanded="true"]').forEach(openItem => {
            if (openItem !== item) openItem.setAttribute('aria-expanded', 'false');
          });
          const expanded = item.getAttribute('aria-expanded') === 'true';
          item.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        });
        item.appendChild(button);

        const dropdown = document.createElement('div');
        dropdown.className = 'top-nav-dropdown';

        function createDropdown(container, children) {
          children.forEach(child => {
            if (child.children && child.children.length) {
              const wrapper = document.createElement('div');
              wrapper.className = 'has-sub';
              wrapper.setAttribute('aria-expanded', 'false');

              const childButton = document.createElement('button');
              childButton.type = 'button';
              childButton.className = 'top-nav-button sub-button';
              childButton.textContent = child.title;
              childButton.addEventListener('click', e => {
                e.stopPropagation();
                const expanded = wrapper.getAttribute('aria-expanded') === 'true';
                wrapper.setAttribute('aria-expanded', expanded ? 'false' : 'true');
              });
              wrapper.appendChild(childButton);

              const sub = document.createElement('div');
              sub.className = 'top-nav-subdropdown';
              createDropdown(sub, child.children);
              wrapper.appendChild(sub);
              container.appendChild(wrapper);
            } else {
              const link = document.createElement('a');
              link.href = child.href;
              link.textContent = child.title;
              container.appendChild(link);
            }
          });
        }

        createDropdown(dropdown, section.children);

        item.appendChild(dropdown);
      } else {
        const link = document.createElement('a');
        link.className = 'top-nav-button';
        link.href = section.href;
        link.textContent = section.title;
        item.appendChild(link);
      }

      headerNav.appendChild(item);
    });

    document.addEventListener('click', () => {
      document.querySelectorAll('.top-nav-item[aria-expanded="true"]').forEach(openItem => {
        openItem.setAttribute('aria-expanded', 'false');
      });
      // also close any nested submenus
      document.querySelectorAll('.has-sub[aria-expanded="true"]').forEach(openSub => {
        openSub.setAttribute('aria-expanded', 'false');
      });
    });
  }

  function removeLegacyToc() {
    const oldToc = document.querySelector('blockquote.torillic-toc');
    if (!oldToc) return;
    const previous = oldToc.previousElementSibling;
    if (previous && previous.tagName === 'H3' && previous.textContent.trim().toLowerCase() === 'contents') {
      previous.remove();
    }
    oldToc.remove();
  }

  function buildSidebar() {
    const pageMain = document.querySelector('main.torillic-page');
    if (!pageMain) return;

    const headings = Array.from(pageMain.querySelectorAll('h2, h3, h4'))
      .filter(h => h.id)
      .map(h => ({
        level: Number(h.tagName.slice(1)),
        text: h.textContent.replace(/¶/g, '').trim(),
        id: h.id
      }));

    if (!headings.length) return;

    const sidebar = document.createElement('aside');
    sidebar.id = 'wiki-sidebar';
    sidebar.setAttribute('aria-label', 'Page contents');

    const title = document.createElement('div');
    title.className = 'wiki-sidebar-title';
    title.textContent = 'Contents';
    sidebar.appendChild(title);

    const list = document.createElement('ul');
    list.className = 'wiki-sidebar-list';

    let currentSection = null;
    let currentSubsection = null;

    headings.forEach(heading => {
      if (heading.level === 2) {
        currentSection = {
          title: heading.text,
          id: heading.id,
          children: []
        };
        currentSubsection = null;
        list.appendChild(createSectionItem(currentSection));
      } else if (heading.level === 3 && currentSection) {
        currentSubsection = {
          title: heading.text,
          id: heading.id,
          children: []
        };
        currentSection.children.push(currentSubsection);
      } else if (heading.level === 4 && currentSubsection) {
        currentSubsection.children.push({ title: heading.text, id: heading.id });
      }
    });

    if (!list.children.length) return;
    sidebar.appendChild(list);

    const pageWrapper = document.querySelector('.torillic-page');
    pageWrapper.parentNode.insertBefore(sidebar, pageWrapper);

    document.querySelectorAll('.wiki-sidebar details summary').forEach(summary => {
      summary.addEventListener('click', event => {
        const button = summary.querySelector('.toc-toggle');
        if (button && event.target === button) {
          event.preventDefault();
          const details = summary.parentElement;
          details.open = !details.open;
        }
      });
    });
  }

  function createSectionItem(section) {
    const item = document.createElement('li');
    item.className = 'wiki-sidebar-item';

    if (!section.children.length) {
      const link = document.createElement('a');
      link.href = `#${section.id}`;
      link.textContent = section.title;
      item.appendChild(link);
      return item;
    }

    const details = document.createElement('details');
    details.className = 'wiki-sidebar-section';

    const summary = document.createElement('summary');
    summary.className = 'wiki-sidebar-summary';

    const toggleButton = document.createElement('button');
    toggleButton.type = 'button';
    toggleButton.className = 'toc-toggle';
    toggleButton.textContent = '▸';
    toggleButton.setAttribute('aria-label', 'Toggle section');
    summary.appendChild(toggleButton);

    const link = document.createElement('a');
    link.href = `#${section.id}`;
    link.textContent = section.title;
    summary.appendChild(link);
    details.appendChild(summary);

    const childList = document.createElement('ul');
    childList.className = 'wiki-sidebar-sublist';

    section.children.forEach(child => {
      const childItem = document.createElement('li');
      childItem.className = 'wiki-sidebar-subitem';
      const childLink = document.createElement('a');
      childLink.href = `#${child.id}`;
      childLink.textContent = child.title;
      childItem.appendChild(childLink);

      if (child.children && child.children.length) {
        const grandList = document.createElement('ul');
        grandList.className = 'wiki-sidebar-grandlist';
        child.children.forEach(grandChild => {
          const grandItem = document.createElement('li');
          const grandLink = document.createElement('a');
          grandLink.href = `#${grandChild.id}`;
          grandLink.textContent = grandChild.title;
          grandItem.appendChild(grandLink);
          grandList.appendChild(grandItem);
        });
        childItem.appendChild(grandList);
      }

      childList.appendChild(childItem);
    });

    details.appendChild(childList);
    item.appendChild(details);
    return item;
  }

  buildTopNav();
  removeLegacyToc();
  buildSidebar();
})();
