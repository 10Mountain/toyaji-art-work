/* ==========================================================================
   toyaji ART WORK - Main JavaScript Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // --- Category Map & Labels ---
  const CATEGORY_LABELS = {
    digital: 'デジタルイラスト',
    analog: 'アナログイラスト',
    design: 'デザイン',
    logo: 'ロゴ',
    doodle: '落書き'
  };

  // --- Initial Default Sample Works Data ---
  const DEFAULT_WORKS = [
    {
      id: "work-1",
      title: "CYBERPUNK CHARACTER - ELARA",
      category: "digital",
      categoryLabel: "デジタルイラスト",
      image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop",
      year: "2026",
      client: "ゲームキャラクターデザイン",
      tools: "CLIP STUDIO PAINT / Photoshop",
      description: "ネオンエフェクトと疾走感溢れるポージングを意識したオリジナルデジタルイラスト。"
    },
    {
      id: "work-2",
      title: "ORIENTAL DRAGON - 桜龍",
      category: "analog",
      categoryLabel: "アナログイラスト",
      image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=1000&auto=format&fit=crop",
      year: "2026",
      client: "個展出展用作品",
      tools: "透明水彩 / 和紙 / ペン画",
      description: "繊細な線画と水彩の美しいにじみを活かした和モダンなアナログイラストレーション。"
    },
    {
      id: "work-3",
      title: "toyaji STUDIO BRAND MARK",
      category: "logo",
      categoryLabel: "ロゴ",
      image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=1000&auto=format&fit=crop",
      year: "2025",
      client: "スタジオブランディング",
      tools: "Adobe Illustrator",
      description: "幾何学的要素とモダンな立体感を融合したシンボルロゴマーク。"
    },
    {
      id: "work-4",
      title: "SKETCHBOOK & CHARACTER STUDIES",
      category: "doodle",
      categoryLabel: "落書き",
      image: "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=1000&auto=format&fit=crop",
      year: "2026",
      client: "アイディアスケッチ",
      tools: "ミリペン / クロッキー帳",
      description: "キャラクターの喜怒哀楽表現や動的なポーズラインを検証した日常スケッチ。"
    },
    {
      id: "work-5",
      title: "NEO-CITY SKYLINE",
      category: "digital",
      categoryLabel: "デジタルイラスト",
      image: "https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=1000&auto=format&fit=crop",
      year: "2025",
      client: "書籍キービジュアル",
      tools: "Procreate / CLIP STUDIO",
      description: "夜のサイバーシティを描いた背景メインのコンセプトイラスト。"
    },
    {
      id: "work-6",
      title: "EXPRESSIVE ACRYLIC PORTRAIT",
      category: "analog",
      categoryLabel: "アナログイラスト",
      image: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1000&auto=format&fit=crop",
      year: "2025",
      client: "プライベート制作",
      tools: "アクリル絵の具 / キャンバス",
      description: "重厚な筆致とマチエールで表現した感情豊かなポートレート。"
    }
  ];

  // --- State Management ---
  let works = [];
  let currentFilter = 'all';
  let currentSearchQuery = '';
  let currentManagerSearchQuery = '';

  function cleanYear(val) {
    if (!val) return 0;
    const str = String(val).normalize('NFKC').replace(/[^\d]/g, '');
    const num = parseInt(str, 10);
    return isNaN(num) ? 0 : num;
  }

  function sortWorksByYear(arr) {
    return arr.sort((a, b) => {
      const yearA = cleanYear(a.year);
      const yearB = cleanYear(b.year);
      return yearB - yearA;
    });
  }

  // Load Works from API server or localStorage / data/works.json fallback
  async function loadWorks() {
    try {
      const response = await fetch('/api/works');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          works = data;
          try { localStorage.setItem('toyaji_works_data', JSON.stringify(works)); } catch (e) {}
          return;
        }
      }
    } catch (e) {
      console.warn('API server fetch failed, checking localStorage:', e);
    }

    const saved = localStorage.getItem('toyaji_works_data');
    if (saved) {
      try {
        works = JSON.parse(saved);
        return;
      } catch (e) {
        console.error('Failed to parse saved works:', e);
      }
    }
    try {
      const response = await fetch('data/works.json');
      if (response.ok) {
        works = await response.json();
        return;
      }
    } catch (e) {
      console.warn('Could not fetch data/works.json:', e);
    }
    works = [...DEFAULT_WORKS];
  }

  // Image compression helper to avoid localStorage quota issues
  function compressImage(file, maxWidth = 1600, maxHeight = 1600, quality = 0.85) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = (err) => reject(err);
        img.src = e.target.result;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  async function saveWorks() {
    try {
      localStorage.setItem('toyaji_works_data', JSON.stringify(works));
    } catch (e) {
      console.warn('localStorage quota exceeded:', e);
    }
    try {
      const res = await fetch('/api/works/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(works)
      });
      if (res.ok) {
        const resData = await res.json();
        // If images were converted to server paths, refresh works
        if (resData && resData.status === 'success') {
          const freshRes = await fetch('/api/works');
          if (freshRes.ok) {
            works = await freshRes.json();
            try { localStorage.setItem('toyaji_works_data', JSON.stringify(works)); } catch (e) {}
          }
        }
      }
    } catch (e) {
      console.warn('API bulk save failed:', e);
    }
  }

  // --- DOM Elements ---
  const worksGrid = document.getElementById('worksGrid');
  const emptyState = document.getElementById('emptyState');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const heroCatBtns = document.querySelectorAll('.hero-cat-btn');

  // Count Badges
  const countAll = document.getElementById('countAll');
  const countDigital = document.getElementById('countDigital');
  const countAnalog = document.getElementById('countAnalog');
  const countDesign = document.getElementById('countDesign');
  const countLogo = document.getElementById('countLogo');
  const countDoodle = document.getElementById('countDoodle');

  // Detail Modal Elements
  const detailModal = document.getElementById('detailModal');
  const closeDetailModal = document.getElementById('closeDetailModal');
  const modalImg = document.getElementById('modalImg');
  const modalTitle = document.getElementById('modalTitle');
  const modalCategory = document.getElementById('modalCategory');
  const modalYear = document.getElementById('modalYear');
  const modalClient = document.getElementById('modalClient');
  const modalTools = document.getElementById('modalTools');
  const modalDesc = document.getElementById('modalDesc');

  // Manager Modal Elements
  const openManagerBtn = document.getElementById('openManagerBtn');
  const emptyUploadBtn = document.getElementById('emptyUploadBtn');
  const managerModal = document.getElementById('managerModal');
  const closeManagerModal = document.getElementById('closeManagerModal');
  const addWorkForm = document.getElementById('addWorkForm');
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const workImageUrl = document.getElementById('workImageUrl');
  const imgPreviewBox = document.getElementById('imgPreviewBox');
  const uploadPreviewImg = document.getElementById('uploadPreviewImg');
  const exportJsonBtn = document.getElementById('exportJsonBtn');
  const resetWorksBtn = document.getElementById('resetWorksBtn');
  const registeredList = document.getElementById('registeredList');
  const registeredCount = document.getElementById('registeredCount');

  // Edit Work Modal Elements
  const editWorkModal = document.getElementById('editWorkModal');
  const closeEditWorkModal = document.getElementById('closeEditWorkModal');
  const closeEditWorkBtn = document.getElementById('closeEditWorkBtn');
  const editWorkForm = document.getElementById('editWorkForm');
  const editWorkIndex = document.getElementById('editWorkIndex');
  const editWorkTitle = document.getElementById('editWorkTitle');
  const editWorkCategory = document.getElementById('editWorkCategory');
  const editWorkYear = document.getElementById('editWorkYear');
  const editWorkClient = document.getElementById('editWorkClient');
  const editWorkTools = document.getElementById('editWorkTools');
  const editWorkDesc = document.getElementById('editWorkDesc');
  const editPreviewImg = document.getElementById('editPreviewImg');
  const editPreviewBadge = document.getElementById('editPreviewBadge');
  const editDropZone = document.getElementById('editDropZone');
  const editFileInput = document.getElementById('editFileInput');
  const editWorkImageUrl = document.getElementById('editWorkImageUrl');

  let selectedEditImageDataUrl = '';

  // Admin Authentication Elements
  const adminAuthModal = document.getElementById('adminAuthModal');
  const openAdminAuthBtn = document.getElementById('openAdminAuthBtn');
  const closeAdminAuthModal = document.getElementById('closeAdminAuthModal');
  const adminAuthForm = document.getElementById('adminAuthForm');
  const adminPassword = document.getElementById('adminPassword');
  const authErrorMsg = document.getElementById('authErrorMsg');

  const ADMIN_PASSWORD_KEY = 'toyaji_admin_pass';
  const ADMIN_AUTH_SESSION = 'toyaji_admin_authenticated';
  const DEFAULT_PASSWORD = 'toyaji2026';

  // --- Initialize Application ---
  async function init() {
    await loadWorks();
    renderGallery();
    updateCounts();
    renderRegisteredList();
    checkAdminStatus();
    setupEventListeners();
  }

  // --- Admin Authentication Controls ---
  function isAdmin() {
    return sessionStorage.getItem(ADMIN_AUTH_SESSION) === 'true';
  }

  const MODAL_OPEN_SESSION_KEY = 'toyaji_auth_modal_open';

  function checkAdminStatus() {
    const hash = (window.location.hash || '').toLowerCase();
    const urlParams = new URLSearchParams(window.location.search);
    const savedState = sessionStorage.getItem(MODAL_OPEN_SESSION_KEY);

    if (savedState === 'manager' && isAdmin()) {
      if (managerModal) {
        managerModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
      }
      return;
    }

    if (savedState === 'auth' || urlParams.get('admin') === '1' || urlParams.get('admin') === 'true' || hash === '#admin' || hash === '#auth' || hash === '#login') {
      openAdminAuthModalFunc(true);
    }
  }

  window.addEventListener('hashchange', checkAdminStatus);

  function openAdminAuthModalFunc(saveSession = true) {
    if (saveSession) {
      sessionStorage.setItem(MODAL_OPEN_SESSION_KEY, 'auth');
    }
    if (adminAuthModal) {
      adminAuthModal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      if (adminPassword) {
        adminPassword.value = '';
        if (authErrorMsg) authErrorMsg.classList.add('hidden');
        setTimeout(() => adminPassword.focus(), 100);
      }
    }
  }

  // --- Render Gallery Grid ---
  function renderGallery() {
    worksGrid.innerHTML = '';

    let filtered = currentFilter === 'all' 
      ? works 
      : works.filter(item => item.category === currentFilter);

    if (currentSearchQuery) {
      const q = currentSearchQuery.toLowerCase();
      filtered = filtered.filter(w => {
        return (
          (w.title && w.title.toLowerCase().includes(q)) ||
          (w.description && w.description.toLowerCase().includes(q)) ||
          (w.client && w.client.toLowerCase().includes(q)) ||
          (w.tools && w.tools.toLowerCase().includes(q)) ||
          (w.year && String(w.year).includes(q))
        );
      });
    }

    if (filtered.length === 0) {
      worksGrid.classList.add('hidden');
      emptyState.classList.remove('hidden');
      return;
    }

    worksGrid.classList.remove('hidden');
    emptyState.classList.add('hidden');

    filtered.forEach((work) => {
      const card = document.createElement('div');
      card.className = 'work-card';
      card.dataset.id = work.id;

      card.innerHTML = `
        <div class="work-thumb-wrap">
          <img src="${work.image}" alt="${escapeHtml(work.title)}" class="work-thumb" loading="lazy">
          <div class="work-overlay">
            <span class="work-view-btn"><i class="fa-solid fa-magnifying-glass"></i> 詳細を見る</span>
          </div>
        </div>
        <div class="work-info">
          <div class="work-meta-row">
            <span class="work-tag">${CATEGORY_LABELS[work.category] || work.category}</span>
            <span class="work-year">${work.year || ''}</span>
          </div>
          <h3 class="work-title">${escapeHtml(work.title)}</h3>
          <p class="work-client">${escapeHtml(work.client || '')}</p>
        </div>
      `;

      card.addEventListener('click', () => openDetail(work));
      worksGrid.appendChild(card);
    });
  }

  // --- Update Category Counter Badges ---
  function updateCounts() {
    if (countAll) countAll.textContent = works.length;
    if (countDigital) countDigital.textContent = works.filter(w => w.category === 'digital').length;
    if (countAnalog) countAnalog.textContent = works.filter(w => w.category === 'analog').length;
    if (countDesign) countDesign.textContent = works.filter(w => w.category === 'design').length;
    if (countLogo) countLogo.textContent = works.filter(w => w.category === 'logo').length;
    if (countDoodle) countDoodle.textContent = works.filter(w => w.category === 'doodle').length;
  }

  // --- Open Detail Lightbox Modal ---
  function openDetail(work) {
    modalImg.src = work.image;
    modalTitle.textContent = work.title;
    modalCategory.textContent = CATEGORY_LABELS[work.category] || work.category;
    modalYear.textContent = work.year || '2026';
    modalClient.textContent = work.client || '自主制作';
    modalTools.textContent = work.tools || '制作データ';
    modalDesc.textContent = work.description || '作品説明はありません。';

    detailModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeDetail() {
    detailModal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  // --- Manager Modal & Registered Works List ---
  let currentManagerFilter = 'all';
  let draggedFilteredIndex = null;

  function renderRegisteredList() {
    registeredList.innerHTML = '';
    
    // Create array of objects with masterIndex reference
    const filteredWorks = [];
    works.forEach((w, masterIdx) => {
      const matchCat = currentManagerFilter === 'all' || w.category === currentManagerFilter;
      let matchQuery = true;
      if (currentManagerSearchQuery) {
        const q = currentManagerSearchQuery.toLowerCase();
        matchQuery = (
          (w.title && w.title.toLowerCase().includes(q)) ||
          (w.description && w.description.toLowerCase().includes(q)) ||
          (w.client && w.client.toLowerCase().includes(q)) ||
          (w.tools && w.tools.toLowerCase().includes(q)) ||
          (w.year && String(w.year).includes(q))
        );
      }
      if (matchCat && matchQuery) {
        filteredWorks.push({ work: w, masterIndex: masterIdx });
      }
    });

    registeredCount.textContent = `${filteredWorks.length} / ${works.length}`;

    if (filteredWorks.length === 0) {
      registeredList.innerHTML = '<div style="text-align: center; padding: 24px; color: var(--text-light); font-size: 0.85rem;">該当するカテゴリーの作品はありません。</div>';
      return;
    }

    filteredWorks.forEach((itemObj, filteredIndex) => {
      const work = itemObj.work;
      const masterIndex = itemObj.masterIndex;

      const item = document.createElement('div');
      item.className = 'registered-item';
      item.draggable = true;
      item.dataset.filteredIndex = filteredIndex;
      item.dataset.masterIndex = masterIndex;

      const isFirst = filteredIndex === 0;
      const isLast = filteredIndex === filteredWorks.length - 1;

      item.innerHTML = `
        <div class="reg-thumb-info">
          <i class="fa-solid fa-grip-vertical drag-handle" style="cursor: grab; color: var(--text-light); font-size: 0.9rem;" title="ドラッグで順序変更"></i>
          <span class="order-num">#${filteredIndex + 1}</span>
          <img src="${work.image}" alt="thumb" class="reg-thumb">
          <div>
            <div class="reg-title">${escapeHtml(work.title)}</div>
            <div class="reg-cat">${CATEGORY_LABELS[work.category] || work.category} | ${work.year}</div>
          </div>
        </div>
        <div class="reg-actions">
          <button class="btn-move-work btn-move-top" data-filtered-index="${filteredIndex}" title="選択中カテゴリー内の最上部に移動" ${isFirst ? 'disabled' : ''}>
            <i class="fa-solid fa-angles-up"></i>
          </button>
          <button class="btn-move-work btn-move-up" data-filtered-index="${filteredIndex}" title="選択中カテゴリー内で一つ上に移動" ${isFirst ? 'disabled' : ''}>
            <i class="fa-solid fa-arrow-up"></i>
          </button>
          <button class="btn-move-work btn-move-down" data-filtered-index="${filteredIndex}" title="選択中カテゴリー内で一つ下に移動" ${isLast ? 'disabled' : ''}>
            <i class="fa-solid fa-arrow-down"></i>
          </button>
          <button class="btn-move-work btn-move-bottom" data-filtered-index="${filteredIndex}" title="選択中カテゴリー内の最下部に移動" ${isLast ? 'disabled' : ''}>
            <i class="fa-solid fa-angles-down"></i>
          </button>
          <button class="btn-edit-work" data-master-index="${masterIndex}" title="編集・キャプション変更">
            <i class="fa-solid fa-pen-to-square"></i> 編集
          </button>
          <button class="btn-delete-work" data-master-index="${masterIndex}" title="削除">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      `;

      // Drag & Drop Handlers
      item.addEventListener('dragstart', (e) => {
        draggedFilteredIndex = filteredIndex;
        e.dataTransfer.setData('text/plain', String(filteredIndex));
        e.dataTransfer.effectAllowed = 'move';
        item.classList.add('dragging');
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        registeredList.querySelectorAll('.registered-item').forEach(el => {
          el.classList.remove('drag-over-above', 'drag-over-below');
        });
        draggedFilteredIndex = null;
      });

      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        const rect = item.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;

        registeredList.querySelectorAll('.registered-item').forEach(el => {
          if (el !== item) el.classList.remove('drag-over-above', 'drag-over-below');
        });

        if (e.clientY < midY) {
          item.classList.add('drag-over-above');
          item.classList.remove('drag-over-below');
        } else {
          item.classList.add('drag-over-below');
          item.classList.remove('drag-over-above');
        }
      });

      item.addEventListener('dragleave', () => {
        item.classList.remove('drag-over-above', 'drag-over-below');
      });

      item.addEventListener('drop', async (e) => {
        e.preventDefault();
        const rect = item.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const isBelow = e.clientY >= midY;

        registeredList.querySelectorAll('.registered-item').forEach(el => {
          el.classList.remove('drag-over-above', 'drag-over-below');
        });

        let srcIdx = draggedFilteredIndex;
        if (srcIdx === null || srcIdx === undefined) {
          const raw = e.dataTransfer.getData('text/plain');
          if (raw) srcIdx = parseInt(raw, 10);
        }

        if (srcIdx !== null && !isNaN(srcIdx) && srcIdx !== filteredIndex) {
          let targetIdx = filteredIndex;
          if (isBelow && srcIdx < filteredIndex) {
            targetIdx = filteredIndex;
          } else if (!isBelow && srcIdx > filteredIndex) {
            targetIdx = filteredIndex;
          }

          reorderCategoryWorks(srcIdx, targetIdx);
          showToast('並び順を保存中...');
          await saveWorks();
          renderGallery();
          updateCounts();
          renderRegisteredList();
          showToast('選択中カテゴリーの並び順を変更・保存しました！');
        }
      });

      registeredList.appendChild(item);
    });

    // Helper for reordering category items within master works array
    function reorderCategoryWorks(fromFilteredIdx, toFilteredIdx) {
      if (fromFilteredIdx === toFilteredIdx) return;
      const srcMasterIdx = filteredWorks[fromFilteredIdx].masterIndex;
      const targetWorkId = filteredWorks[toFilteredIdx].work.id;

      const [removed] = works.splice(srcMasterIdx, 1);
      const newTargetMasterIdx = works.findIndex(w => w.id === targetWorkId);

      if (fromFilteredIdx < toFilteredIdx) {
        works.splice(newTargetMasterIdx + 1, 0, removed);
      } else {
        works.splice(newTargetMasterIdx, 0, removed);
      }
    }

    // Move Top Event Listeners
    registeredList.querySelectorAll('.btn-move-top').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const fIdx = parseInt(e.currentTarget.dataset.filteredIndex, 10);
        if (fIdx > 0) {
          reorderCategoryWorks(fIdx, 0);
          await saveWorks();
          renderGallery();
          updateCounts();
          renderRegisteredList();
          showToast('カテゴリーの最上部に移動しました！');
        }
      });
    });

    // Move Up Event Listeners
    registeredList.querySelectorAll('.btn-move-up').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const fIdx = parseInt(e.currentTarget.dataset.filteredIndex, 10);
        if (fIdx > 0) {
          reorderCategoryWorks(fIdx, fIdx - 1);
          await saveWorks();
          renderGallery();
          updateCounts();
          renderRegisteredList();
          showToast('カテゴリー内で一つ上に移動しました！');
        }
      });
    });

    // Move Down Event Listeners
    registeredList.querySelectorAll('.btn-move-down').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const fIdx = parseInt(e.currentTarget.dataset.filteredIndex, 10);
        if (fIdx < filteredWorks.length - 1) {
          reorderCategoryWorks(fIdx, fIdx + 1);
          await saveWorks();
          renderGallery();
          updateCounts();
          renderRegisteredList();
          showToast('カテゴリー内で一つ下に移動しました！');
        }
      });
    });

    // Move Bottom Event Listeners
    registeredList.querySelectorAll('.btn-move-bottom').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const fIdx = parseInt(e.currentTarget.dataset.filteredIndex, 10);
        if (fIdx < filteredWorks.length - 1) {
          reorderCategoryWorks(fIdx, filteredWorks.length - 1);
          await saveWorks();
          renderGallery();
          updateCounts();
          renderRegisteredList();
          showToast('カテゴリーの最下部に移動しました！');
        }
      });
    });

    // Edit Event Listeners
    registeredList.querySelectorAll('.btn-edit-work').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const masterIdx = parseInt(e.currentTarget.dataset.masterIndex, 10);
        openEditModal(masterIdx);
      });
    });

    // Delete Event Listeners
    registeredList.querySelectorAll('.btn-delete-work').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const masterIdx = parseInt(e.currentTarget.dataset.masterIndex, 10);
        if (confirm(`作品「${works[masterIdx].title}」を削除しますか？`)) {
          const deletedId = works[masterIdx].id;
          works.splice(masterIdx, 1);
          try {
            await fetch(`/api/works/${deletedId}`, { method: 'DELETE' });
          } catch (err) {}
          await saveWorks();
          renderGallery();
          updateCounts();
          renderRegisteredList();
          showToast('作品を削除し、サーバーに保存しました');
        }
      });
    });
  }

  // --- Edit Work Functions ---
  function openEditModal(index) {
    const work = works[index];
    if (!work) return;

    selectedEditImageDataUrl = '';
    editWorkIndex.value = index;
    if (editPreviewImg) editPreviewImg.src = work.image;
    if (editPreviewBadge) editPreviewBadge.textContent = '現在の登録画像';
    if (editWorkImageUrl) editWorkImageUrl.value = '';

    editWorkTitle.value = work.title || '';
    editWorkCategory.value = work.category || 'digital';
    editWorkYear.value = work.year || '';
    editWorkClient.value = work.client || '';
    editWorkTools.value = work.tools || '';
    editWorkDesc.value = work.description || '';

    editWorkModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeEditModal() {
    editWorkModal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  // --- Edit Image Dropzone & Preview Events ---
  if (editDropZone) {
    editDropZone.addEventListener('click', () => editFileInput.click());

    editDropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      editDropZone.classList.add('dragover');
    });

    editDropZone.addEventListener('dragleave', () => {
      editDropZone.classList.remove('dragover');
    });

    editDropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      editDropZone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleEditFile(e.dataTransfer.files[0]);
      }
    });
  }

  if (editFileInput) {
    editFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleEditFile(e.target.files[0]);
      }
    });
  }

  if (editWorkImageUrl) {
    editWorkImageUrl.addEventListener('input', () => {
      if (editWorkImageUrl.value.trim()) {
        selectedEditImageDataUrl = editWorkImageUrl.value.trim();
        if (editPreviewImg) editPreviewImg.src = selectedEditImageDataUrl;
        if (editPreviewBadge) editPreviewBadge.textContent = '新規URLプレビュー中';
      }
    });
  }

  async function handleEditFile(file) {
    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください。');
      return;
    }
    try {
      if (editPreviewBadge) editPreviewBadge.textContent = '画像を最適化中...';
      selectedEditImageDataUrl = await compressImage(file);
      if (editPreviewImg) editPreviewImg.src = selectedEditImageDataUrl;
      if (editPreviewBadge) editPreviewBadge.textContent = '新規画像プレビュー中';
    } catch (err) {
      console.error('Error compressing edit image:', err);
      alert('画像の処理中にエラーが発生しました。別の画像をお試しいただくか、画像URLをご指定ください。');
    }
  }

  // --- File Dropzone & Image Preview ---
  let selectedImageDataUrl = '';

  dropZone.addEventListener('click', () => fileInput.click());

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  });

  workImageUrl.addEventListener('input', () => {
    if (workImageUrl.value.trim()) {
      selectedImageDataUrl = workImageUrl.value.trim();
      uploadPreviewImg.src = selectedImageDataUrl;
      imgPreviewBox.classList.remove('hidden');
    }
  });

  async function handleFile(file) {
    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください。');
      return;
    }
    try {
      showToast('画像を最適化中...');
      selectedImageDataUrl = await compressImage(file);
      uploadPreviewImg.src = selectedImageDataUrl;
      imgPreviewBox.classList.remove('hidden');
    } catch (err) {
      console.error('Error compressing upload image:', err);
      alert('画像の処理中にエラーが発生しました。別の画像をお試しいただくか、画像URLをご指定ください。');
    }
  }

  // --- Add Work Submission ---
  addWorkForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('workTitle').value.trim();
    const category = document.getElementById('workCategory').value;
    const client = document.getElementById('workClient').value.trim() || '自主制作';
    const tools = document.getElementById('workTools').value.trim() || '制作データ';
    const year = document.getElementById('workYear').value.trim() || '2026';
    const description = document.getElementById('workDesc').value.trim() || '';

    const imageUrl = selectedImageDataUrl || workImageUrl.value.trim();

    if (!imageUrl) {
      alert('作品画像をアップロードするか、URLを入力してください。');
      return;
    }

    const newWork = {
      id: 'work-' + Date.now(),
      title: title,
      category: category,
      categoryLabel: CATEGORY_LABELS[category],
      image: imageUrl,
      year: year,
      client: client,
      tools: tools,
      description: description
    };

    works.push(newWork);
    works = sortWorksByYear(works);
    showToast('作品データをサーバーへ同期保存中...');
    await saveWorks();
    renderGallery();
    updateCounts();
    renderRegisteredList();

    // Reset Form
    addWorkForm.reset();
    imgPreviewBox.classList.add('hidden');
    selectedImageDataUrl = '';

    managerModal.classList.add('hidden');
    document.body.style.overflow = '';
    showToast('新しい作品を追加し、永久保存しました！');
  });

  // --- Export JSON ---
  exportJsonBtn.addEventListener('click', () => {
    const jsonStr = JSON.stringify(works, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'works.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('works.json ファイルをダウンロードしました');
  });

  // --- Reset Works to Default ---
  resetWorksBtn.addEventListener('click', () => {
    if (confirm('初期サンプルデータにリセットしますか？')) {
      works = [...DEFAULT_WORKS];
      saveWorks();
      renderGallery();
      updateCounts();
      renderRegisteredList();
      showToast('初期作品データにリセットしました');
    }
  });

  // --- Auto Sort Works By Year Button ---
  const autoSortByYearBtn = document.getElementById('autoSortByYearBtn');
  if (autoSortByYearBtn) {
    autoSortByYearBtn.addEventListener('click', async () => {
      if (confirm('全ての作品を「制作年数が新しい順（2026年〜）」に一括ソートしますか？')) {
        works = sortWorksByYear(works);
        await saveWorks();
        renderGallery();
        updateCounts();
        renderRegisteredList();
        showToast('制作年順（2026年〜）に並べ替えて保存しました！');
      }
    });
  }

  // --- Toast Notification ---
  function showToast(message) {
    toastMsg.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 3000);
  }

  // --- Event Listeners Setup ---
  function setupEventListeners() {
    // Filter Tabs
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        currentFilter = e.currentTarget.dataset.filter;
        renderGallery();
      });
    });

    // Gallery Search Input
    const worksSearchInput = document.getElementById('worksSearchInput');
    const searchClearBtn = document.getElementById('searchClearBtn');
    if (worksSearchInput) {
      worksSearchInput.addEventListener('input', (e) => {
        currentSearchQuery = e.target.value.trim();
        if (searchClearBtn) {
          if (currentSearchQuery) searchClearBtn.classList.remove('hidden');
          else searchClearBtn.classList.add('hidden');
        }
        renderGallery();
      });
    }
    if (searchClearBtn) {
      searchClearBtn.addEventListener('click', () => {
        if (worksSearchInput) worksSearchInput.value = '';
        currentSearchQuery = '';
        searchClearBtn.classList.add('hidden');
        renderGallery();
      });
    }

    // Manager Search Input
    const managerSearchInput = document.getElementById('managerSearchInput');
    if (managerSearchInput) {
      managerSearchInput.addEventListener('input', (e) => {
        currentManagerSearchQuery = e.target.value.trim();
        renderRegisteredList();
      });
    }

    // Hero Category Pills
    heroCatBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const filter = e.currentTarget.dataset.filter;
        currentFilter = filter;

        filterBtns.forEach(b => {
          if (b.dataset.filter === filter) b.classList.add('active');
          else b.classList.remove('active');
        });

        document.getElementById('works').scrollIntoView({ behavior: 'smooth' });
        renderGallery();
      });
    });

    // Manager Modal Category Filter Tabs
    const managerFilterBtns = document.querySelectorAll('#managerCategoryFilter [data-manager-filter]');
    managerFilterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        managerFilterBtns.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        currentManagerFilter = e.currentTarget.dataset.managerFilter;
        renderRegisteredList();
      });
    });

    // Close Modals
    closeDetailModal.addEventListener('click', closeDetail);
    detailModal.addEventListener('click', (e) => {
      if (e.target === detailModal) closeDetail();
    });

    openManagerBtn.addEventListener('click', openAdminAuthModalFunc);

    if (emptyUploadBtn) {
      emptyUploadBtn.addEventListener('click', openAdminAuthModalFunc);
    }

    // Admin Auth Open & Submit
    if (openAdminAuthBtn) {
      openAdminAuthBtn.addEventListener('click', openAdminAuthModalFunc);
    }

    // --- Secret Admin Commands (Hidden Triggers) ---
    let keyBuffer = '';
    const secretWords = ['toyaji', 'admin'];
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiIndex = 0;

    document.addEventListener('keydown', (e) => {
      // Ignore key events when typing inside form input fields
      const tag = document.activeElement ? document.activeElement.tagName : '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        return;
      }

      // Extract physical key character regardless of Japanese IME input mode
      let keyChar = '';
      if (e.code && e.code.startsWith('Key')) {
        keyChar = e.code.replace('Key', '').toLowerCase();
      } else if (e.key && e.key.length === 1) {
        keyChar = e.key.toLowerCase();
      }

      // 1. Konami Code Check
      const kVal = e.code || e.key;
      if (kVal === konamiCode[konamiIndex] || e.key === konamiCode[konamiIndex] || keyChar === konamiCode[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konamiCode.length) {
          konamiIndex = 0;
          showToast('🎮 コナミコマンド検知！管理者認証画面を開きます');
          openAdminAuthModalFunc();
          return;
        }
      } else {
        konamiIndex = 0;
      }

      // 2. Secret Keyword Check ("toyaji" or "admin")
      if (keyChar && /[a-z0-9]/.test(keyChar)) {
        keyBuffer += keyChar;
        if (keyBuffer.length > 20) {
          keyBuffer = keyBuffer.slice(-20);
        }
        for (const word of secretWords) {
          if (keyBuffer.endsWith(word)) {
            keyBuffer = '';
            showToast(`🔓 隠しコマンド [ ${word} ] を検知！管理者認証画面を開きます`);
            openAdminAuthModalFunc();
            break;
          }
        }
      }
    });



    if (closeAdminAuthModal) {
      closeAdminAuthModal.addEventListener('click', () => {
        sessionStorage.removeItem(MODAL_OPEN_SESSION_KEY);
        adminAuthModal.classList.add('hidden');
        document.body.style.overflow = '';
      });
    }

    if (adminAuthModal) {
      adminAuthModal.addEventListener('click', (e) => {
        if (e.target === adminAuthModal) {
          sessionStorage.removeItem(MODAL_OPEN_SESSION_KEY);
          adminAuthModal.classList.add('hidden');
          document.body.style.overflow = '';
        }
      });
    }

    if (adminAuthForm) {
      adminAuthForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const inputPass = adminPassword.value.trim();
        const savedPass = localStorage.getItem(ADMIN_PASSWORD_KEY) || DEFAULT_PASSWORD;

        if (inputPass === savedPass) {
          sessionStorage.setItem(ADMIN_AUTH_SESSION, 'true');
          sessionStorage.setItem(MODAL_OPEN_SESSION_KEY, 'manager');
          adminAuthModal.classList.add('hidden');
          authErrorMsg.classList.add('hidden');
          managerModal.classList.remove('hidden');
          document.body.style.overflow = 'hidden';
          showToast('管理者としてログインしました');
        } else {
          authErrorMsg.classList.remove('hidden');
        }
      });
    }

    // Shortcut Key for Admin Access (Ctrl+Shift+A or Cmd+Shift+A)
    window.addEventListener('keydown', (e) => {
      const isA = e.key === 'A' || e.key === 'a' || e.code === 'KeyA';
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && isA) {
        e.preventDefault();
        openAdminAuthModalFunc();
      }
    });

    if (closeManagerModal) {
      closeManagerModal.addEventListener('click', () => {
        sessionStorage.removeItem(MODAL_OPEN_SESSION_KEY);
        managerModal.classList.add('hidden');
        document.body.style.overflow = '';
      });
    }

    if (managerModal) {
      managerModal.addEventListener('click', (e) => {
        if (e.target === managerModal) {
          sessionStorage.removeItem(MODAL_OPEN_SESSION_KEY);
          managerModal.classList.add('hidden');
          document.body.style.overflow = '';
        }
      });
    }

    managerModal.addEventListener('click', (e) => {
      if (e.target === managerModal) {
        managerModal.classList.add('hidden');
        document.body.style.overflow = '';
      }
    });

    // Edit Work Form Submission & Modal Controls
    if (editWorkForm) {
      editWorkForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const index = parseInt(editWorkIndex.value, 10);
        if (isNaN(index) || !works[index]) return;

        const newImg = selectedEditImageDataUrl || (editWorkImageUrl ? editWorkImageUrl.value.trim() : '');
        if (newImg) {
          works[index].image = newImg;
        }

        works[index].title = editWorkTitle.value.trim();
        works[index].category = editWorkCategory.value;
        works[index].categoryLabel = CATEGORY_LABELS[editWorkCategory.value];
        works[index].year = editWorkYear.value.trim();
        works[index].client = editWorkClient.value.trim();
        works[index].tools = editWorkTools.value.trim();
        works[index].description = editWorkDesc.value.trim();

        showToast('変更内容をサーバーへ同期保存中...');
        await saveWorks();
        renderGallery();
        updateCounts();
        renderRegisteredList();
        closeEditModal();
        showToast('作品情報・画像を変更し、サーバーに永久保存しました！');
      });
    }

    if (closeEditWorkModal) {
      closeEditWorkModal.addEventListener('click', closeEditModal);
    }
    if (closeEditWorkBtn) {
      closeEditWorkBtn.addEventListener('click', closeEditModal);
    }
    if (editWorkModal) {
      editWorkModal.addEventListener('click', (e) => {
        if (e.target === editWorkModal) {
          closeEditModal();
        }
      });
    }

    // Mobile Menu Toggle
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('show');
    });

    // --- Contact Form & Recipient Email Management ---
    function getTargetEmail() {
      return localStorage.getItem('toyaji_target_email') || '10mountain.toyaji@gmail.com';
    }

    function updateEmailDisplay() {
      const email = getTargetEmail();
      const directEmailText = document.getElementById('directEmailText');
      const directEmailBoxText = document.getElementById('directEmailBoxText');
      const directEmailLink = document.getElementById('directEmailLink');
      const targetEmailInput = document.getElementById('targetEmailInput');

      if (directEmailText) directEmailText.textContent = email;
      if (directEmailBoxText) directEmailBoxText.textContent = email;
      if (directEmailLink) directEmailLink.href = `mailto:${email}`;
      if (targetEmailInput && !targetEmailInput.value) targetEmailInput.value = email;
    }

    // Initialize display on load
    updateEmailDisplay();

    // Save Email Settings Button
    const saveEmailConfigBtn = document.getElementById('saveEmailConfigBtn');
    if (saveEmailConfigBtn) {
      saveEmailConfigBtn.addEventListener('click', () => {
        const inputVal = document.getElementById('targetEmailInput')?.value.trim();
        if (!inputVal || !inputVal.includes('@')) {
          showToast('有効なメールアドレスを入力してください');
          return;
        }
        localStorage.setItem('toyaji_target_email', inputVal);
        updateEmailDisplay();
        showToast(`受信メールアドレスを ${inputVal} に保存しました！`);
      });
    }

    // Copy Email Address Button
    const copyEmailBtn = document.getElementById('copyEmailBtn');
    if (copyEmailBtn) {
      copyEmailBtn.addEventListener('click', () => {
        const email = getTargetEmail();
        navigator.clipboard.writeText(email).then(() => {
          showToast(`メールアドレス (${email}) をコピーしました！`);
        }).catch(() => {
          showToast(email);
        });
      });
    }

    // Contact Form AJAX Submission (FormSubmit API + Local Backup)
    if (contactForm) {
      contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';

        const name = document.getElementById('contactName').value.trim();
        const email = document.getElementById('contactEmail').value.trim();
        const categorySelect = document.getElementById('contactCategory');
        const categoryText = categorySelect.options[categorySelect.selectedIndex]?.text || '';
        const deadline = document.getElementById('contactDeadline').value.trim();
        const message = document.getElementById('contactMessage').value.trim();
        const targetEmail = getTargetEmail();

        const alertContainer = document.getElementById('contactAlertContainer');
        if (alertContainer) {
          alertContainer.innerHTML = '';
        }

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> メッセージ送信中...';
        }

        const payload = {
          name: name,
          email: email,
          category: categoryText,
          deadline: deadline || '指定なし',
          message: message,
          _subject: `【toyaji ART WORK お問い合わせ】${name}様より (${categoryText})`,
          _template: "table"
        };

        let sentSuccess = false;

        // 1. Local Python API Backup Save (if running server.py)
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          try {
            await fetch('/api/contact', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
          } catch (err) {
            console.warn('Local contact API save note:', err);
          }
        }

        // 2. FormSubmit AJAX API Submission
        try {
          if (targetEmail && targetEmail.includes('@') && !targetEmail.includes('example.com')) {
            const res = await fetch(`https://formsubmit.co/ajax/${targetEmail}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify(payload)
            });

            const resData = await res.json();
            if (res.ok && (resData.success === 'true' || resData.success === true)) {
              sentSuccess = true;
            }
          }
        } catch (err) {
          console.warn('FormSubmit AJAX request error:', err);
        }

        // 3. UI Response Feedback
        if (alertContainer) {
          if (sentSuccess) {
            alertContainer.innerHTML = `
              <div class="contact-alert contact-alert-success">
                <i class="fa-solid fa-circle-check" style="font-size: 1.4rem; margin-top: 2px;"></i>
                <div>
                  <strong>お問い合わせメッセージを送信いたしました！</strong><br>
                  ${name}様、ご入力ありがとうございます。送信内容が ${targetEmail} へ自動送信されました。<br>
                  内容を確認の上、ご入力いただいたメールアドレス (${email}) 宛てに折り返しご連絡いたします。
                </div>
              </div>
            `;
            contactForm.reset();
            showToast('お問い合わせの送信が完了しました！');
          } else {
            // Fallback: If FormSubmit needs first-time activation or mailto trigger
            const subjectEnc = encodeURIComponent(`【toyaji ART WORK お問い合わせ】${name}様より (${categoryText})`);
            const bodyEnc = encodeURIComponent(`【toyaji ART WORK お問い合わせ内容】\n\n■お名前: ${name}\n■メール: ${email}\n■カテゴリー: ${categoryText}\n■希望納品時期: ${deadline}\n\n■ご依頼詳細:\n${message}`);
            const mailtoUrl = `mailto:${targetEmail}?subject=${subjectEnc}&body=${bodyEnc}`;

            alertContainer.innerHTML = `
              <div class="contact-alert contact-alert-success">
                <i class="fa-solid fa-paper-plane" style="font-size: 1.4rem; margin-top: 2px;"></i>
                <div>
                  <strong>お問い合わせ内容を受け付けました！</strong><br>
                  ${name}様、ありがとうございます。<br>
                  メールアプリから送信をご希望の場合は <a href="${mailtoUrl}" style="text-decoration: underline; font-weight: bold;">[こちらのリンク]</a> をタップしてメールソフトを起動できます。
                </div>
              </div>
            `;
            contactForm.reset();
            showToast('お問い合わせを受け付けました。');
          }
        }

        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnHtml;
        }
      });
    }

    // --- Theme Switcher Logic ---
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');

    function setTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('toyaji_theme', theme);
      if (themeIcon) {
        if (theme === 'dark') {
          themeIcon.className = 'fa-solid fa-sun';
          themeToggleBtn.setAttribute('title', 'ライトモードに切り替え');
        } else {
          themeIcon.className = 'fa-solid fa-moon';
          themeToggleBtn.setAttribute('title', 'ダークモードに切り替え');
        }
      }
    }

    function initTheme() {
      const savedTheme = localStorage.getItem('toyaji_theme');
      if (savedTheme) {
        setTheme(savedTheme);
      } else {
        // Default to dark mode for artistic glow, or light if system prefers
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark ? 'dark' : 'light');
      }
    }

    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        showToast(newTheme === 'dark' ? '🌙 ダークモードに切り替えました' : '☀️ ライトモードに切り替えました');
      });
    }

    initTheme();

    // --- Scroll Reveal Animations Observer ---
    function initScrollReveal() {
      const revealElements = document.querySelectorAll('.reveal-on-scroll, .section-header, .service-card, .about-container, .contact-card, .process-banner');
      
      const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      };

      const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, observerOptions);

      revealElements.forEach(el => {
        el.classList.add('reveal-on-scroll');
        revealObserver.observe(el);
      });
    }

    initScrollReveal();

    // Scroll Header Styling
    window.addEventListener('scroll', () => {
      const navbar = document.getElementById('navbar');
      if (window.scrollY > 50) {
        navbar.style.boxShadow = 'var(--shadow-md)';
      } else {
        navbar.style.boxShadow = 'none';
      }
    });
  }

  // Helper HTML Escape
  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Run app
  init();
});
