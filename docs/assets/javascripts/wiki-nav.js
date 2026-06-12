(function () {
  const script = document.currentScript || document.getElementsByTagName('script').item(document.getElementsByTagName('script').length - 1);
  if (!script) return;

  const siteRoot = new URL('../..', script.src);

  function loadSiteStructure() {
    return fetch(new URL('wiki-nav-data.json', script.src), { cache: 'no-store' })
      .then(response => (response.ok ? response.json() : []))
      .catch(() => []);
  }

  function buildTopNav(siteStructure) {
    const h1 = document.querySelector('.torillic-header h1');
    if (h1) {
      const a = document.createElement('a');
      a.href = siteRoot.href;
      a.textContent = h1.textContent;
      h1.innerHTML = '';
      h1.appendChild(a);
    }

    const headerNav = document.querySelector('.torillic-header nav');
    if (!headerNav) return;
    if (!Array.isArray(siteStructure) || siteStructure.length === 0) return;

    const header = headerNav.closest('.torillic-header');
    if (header && !header.querySelector('.mobile-nav-toggle')) {
      const mobileToggle = document.createElement('button');
      mobileToggle.type = 'button';
      mobileToggle.className = 'mobile-nav-toggle';
      mobileToggle.textContent = 'Menu';
      mobileToggle.setAttribute('aria-controls', 'wiki-top-nav');
      mobileToggle.setAttribute('aria-expanded', 'false');
      mobileToggle.addEventListener('click', event => {
        event.stopPropagation();
        const open = document.body.classList.toggle('mobile-nav-open');
        mobileToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      header.insertBefore(mobileToggle, headerNav);
    }

    headerNav.innerHTML = '';
    headerNav.classList.add('wiki-top-nav');
    headerNav.id = 'wiki-top-nav';
    headerNav.addEventListener('click', event => {
      event.stopPropagation();
    });

    siteStructure.forEach(section => {
      if (!section.children || section.children.length === 0) return;

      const item = document.createElement('div');
      item.className = 'top-nav-item';
      item.setAttribute('aria-expanded', 'false');

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'top-nav-button';
      button.textContent = section.title;
      button.addEventListener('click', event => {
        event.stopPropagation();
        document.querySelectorAll('.top-nav-item[aria-expanded="true"]').forEach(openItem => {
          if (openItem !== item) openItem.setAttribute('aria-expanded', 'false');
        });
        const expanded = item.getAttribute('aria-expanded') === 'true';
        item.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      });
      item.appendChild(button);

      const dropdown = document.createElement('div');
      dropdown.className = 'top-nav-dropdown';
      dropdown.addEventListener('click', event => {
        event.stopPropagation();
      });
      section.children.forEach(child => dropdown.appendChild(createTopNavEntry(child)));

      item.appendChild(dropdown);
      headerNav.appendChild(item);
    });

    document.addEventListener('click', () => {
      document.querySelectorAll('.top-nav-item[aria-expanded="true"]').forEach(openItem => {
        openItem.setAttribute('aria-expanded', 'false');
      });
      document.querySelectorAll('.has-sub[aria-expanded="true"]').forEach(openSub => {
        openSub.setAttribute('aria-expanded', 'false');
      });
    });

    headerNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        document.body.classList.remove('mobile-nav-open');
        document.querySelector('.mobile-nav-toggle')?.setAttribute('aria-expanded', 'false');
      });
    });
  }

  function createTopNavEntry(entry) {
    const hasChildren = Array.isArray(entry.children) && entry.children.length > 0;

    if (!hasChildren) {
      const link = document.createElement('a');
      link.href = new URL(entry.href, siteRoot).href;
      link.textContent = entry.title;
      return link;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'has-sub';
    wrapper.setAttribute('aria-expanded', 'false');

    const row = document.createElement('div');
    row.className = 'sub-row';

    if (entry.href) {
      const link = document.createElement('a');
      link.href = new URL(entry.href, siteRoot).href;
      link.textContent = entry.title;
      row.appendChild(link);
    } else {
      const label = document.createElement('span');
      label.textContent = entry.title;
      row.appendChild(label);
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'sub-button';
    button.textContent = '>';
    button.setAttribute('aria-label', `Open ${entry.title} submenu`);
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      toggleSubmenu(wrapper);
    });
    row.appendChild(button);
    wrapper.appendChild(row);

    const subdropdown = document.createElement('div');
    subdropdown.className = 'top-nav-subdropdown';
    entry.children.forEach(child => subdropdown.appendChild(createTopNavEntry(child)));
    wrapper.appendChild(subdropdown);

    return wrapper;
  }

  function toggleSubmenu(wrapper) {
    const expanded = wrapper.getAttribute('aria-expanded') === 'true';
    wrapper.parentElement?.querySelectorAll(':scope > .has-sub[aria-expanded="true"]').forEach(openSub => {
      if (openSub !== wrapper) openSub.setAttribute('aria-expanded', 'false');
    });
    wrapper.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  }

  function removeLegacyToc() {
    document.querySelectorAll('blockquote.torillic-toc').forEach(oldToc => {
      const previous = [];
      let sibling = oldToc.previousElementSibling;

      while (sibling && previous.length < 3) {
        previous.push(sibling);
        sibling = sibling.previousElementSibling;
      }

      previous.forEach(element => {
        const text = element.textContent.trim().toLowerCase();
        const isGeneratedContentsHeading = element.tagName === 'H3' && text === 'contents';
        const isGeneratedContentsGroup = element.tagName === 'H4' && (text === 'contents' || element.querySelector('a'));

        if (isGeneratedContentsHeading || isGeneratedContentsGroup) {
          element.remove();
        }
      });

      oldToc.remove();
    });
  }

  function buildSidebar() {
    const pageMain = document.querySelector('main.torillic-page');
    if (!pageMain) return;

    const headings = Array.from(pageMain.querySelectorAll('h2, h3, h4'))
      .filter(h => h.id)
      .map(h => ({
        level: Number(h.tagName.slice(1)),
        text: h.textContent.replace(/\u00b6/g, '').trim(),
        id: h.id
      }));

    if (!headings.length) return;

    const sidebar = document.createElement('aside');
    sidebar.id = 'wiki-sidebar';
    sidebar.setAttribute('aria-label', 'Page contents');

    const title = document.createElement('div');
    title.className = 'wiki-sidebar-title';
    title.textContent = 'Contents';

    const mobileContentsToggle = document.createElement('button');
    mobileContentsToggle.type = 'button';
    mobileContentsToggle.className = 'mobile-contents-toggle';
    mobileContentsToggle.textContent = 'Contents';
    mobileContentsToggle.setAttribute('aria-controls', 'wiki-sidebar-list');
    mobileContentsToggle.setAttribute('aria-expanded', 'false');
    mobileContentsToggle.addEventListener('click', event => {
      event.stopPropagation();
      const open = sidebar.classList.toggle('mobile-contents-open');
      mobileContentsToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    sidebar.appendChild(title);
    sidebar.appendChild(mobileContentsToggle);

    const list = document.createElement('ul');
    list.className = 'wiki-sidebar-list';
    list.id = 'wiki-sidebar-list';

    let currentSection = null;
    let currentSubsection = null;

    headings.forEach(heading => {
      if (heading.level === 2) {
        currentSection = { title: heading.text, id: heading.id, children: [] };
        currentSubsection = null;
        list.appendChild(createSectionItem(currentSection));
      } else if (heading.level === 3 && currentSection) {
        currentSubsection = { title: heading.text, id: heading.id, children: [] };
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

    sidebar.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        sidebar.classList.remove('mobile-contents-open');
        mobileContentsToggle.setAttribute('aria-expanded', 'false');
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
    toggleButton.textContent = '>';
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

  loadSiteStructure().then(buildTopNav);
  removeLegacyToc();
  buildSidebar();
})();
