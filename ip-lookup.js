/**
 * Mini Tools - IP Inspector Module (ip-lookup.js)
 * Fetches public IP, geolocation, ISP data with fallback APIs and renders safe diagnostics.
 */

// State Management
const IPState = {
  ipData: null,
  localIPData: null,
  clientData: null,
  mapInstance: null,
  mapMarker: null,
  mapCircle: null,
  isMapLoaded: false,
  isMapVisible: false,
  isLoading: false,
};

// 1. Client Environment Collector
function collectClientEnvironment() {
  const userAgent = navigator.userAgent;
  let browser = '알 수 없음';
  let os = '알 수 없음';

  // Simple safe OS detection
  if (/windows/i.test(userAgent)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(userAgent)) os = 'macOS';
  else if (/android/i.test(userAgent)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(userAgent)) os = 'iOS';
  else if (/linux/i.test(userAgent)) os = 'Linux';

  // Simple safe Browser detection
  if (/edg/i.test(userAgent)) browser = 'Microsoft Edge';
  else if (/chrome|crios/i.test(userAgent)) browser = 'Google Chrome';
  else if (/firefox|fxios/i.test(userAgent)) browser = 'Mozilla Firefox';
  else if (/safari/i.test(userAgent)) browser = 'Apple Safari';
  else if (/opera|opr/i.test(userAgent)) browser = 'Opera';

  const screenRes = `${window.screen.width} × ${window.screen.height} (픽셀 비율 ${window.devicePixelRatio || 1})`;
  const language = navigator.language || (navigator.languages && navigator.languages[0]) || 'ko-KR';
  const protocol = window.location.protocol.toUpperCase().replace(':', '');
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Seoul';

  return {
    browser,
    os,
    screenRes,
    language,
    protocol,
    timezone,
    userAgent
  };
}

// 2. Fetch IP with Fallback Strategy
async function fetchIPData() {
  setLoadingState(true);

  // Strategy 1: ipwho.is (CORS free, rich details: IP, country, city, ISP, lat, lon)
  try {
    const res = await fetch('https://ipwho.is/', { cache: 'no-store' });
    if (!res.ok) throw new Error(`ipwho.is responded with ${res.status}`);
    const data = await res.json();
    if (data.success === false) throw new Error(data.message || 'ipwho.is failed');

    const result = {
      ip: data.ip,
      type: data.type || (data.ip.includes(':') ? 'IPv6' : 'IPv4'),
      country: data.country || '알 수 없음',
      countryCode: data.country_code || '',
      flag: (data.flag && data.flag.emoji) ? data.flag.emoji : '🌐',
      region: data.region || '알 수 없음',
      city: data.city || '알 수 없음',
      postal: data.postal || 'N/A',
      latitude: data.latitude,
      longitude: data.longitude,
      isp: (data.connection && data.connection.isp) ? data.connection.isp : '알 수 없음',
      org: (data.connection && data.connection.org) ? data.connection.org : '알 수 없음',
      asn: (data.connection && data.connection.asn) ? `AS${data.connection.asn}` : 'N/A',
      timezone: (data.timezone && data.timezone.id) ? data.timezone.id : 'N/A',
      utcOffset: (data.timezone && data.timezone.utc) ? data.timezone.utc : '',
    };
    renderIPData(result);
    return;
  } catch (err1) {
    console.warn('1차 API (ipwho.is) 호출 실패, 2차 API로 폴백합니다:', err1.message);
  }

  // Strategy 2: ipapi.co/json/
  try {
    const res = await fetch('https://ipapi.co/json/', { cache: 'no-store' });
    if (!res.ok) throw new Error(`ipapi.co responded with ${res.status}`);
    const data = await res.json();

    const result = {
      ip: data.ip,
      type: data.version || (data.ip.includes(':') ? 'IPv6' : 'IPv4'),
      country: data.country_name || data.country || '알 수 없음',
      countryCode: data.country_code || '',
      flag: getFlagEmoji(data.country_code) || '🌐',
      region: data.region || '알 수 없음',
      city: data.city || '알 수 없음',
      postal: data.postal || 'N/A',
      latitude: data.latitude,
      longitude: data.longitude,
      isp: data.org || '알 수 없음',
      org: data.org || '알 수 없음',
      asn: data.asn || 'N/A',
      timezone: data.timezone || 'N/A',
      utcOffset: data.utc_offset || '',
    };
    renderIPData(result);
    return;
  } catch (err2) {
    console.warn('2차 API (ipapi.co) 호출 실패, 3차 API로 폴백합니다:', err2.message);
  }

  // Strategy 3: api64.ipify.org (IP only fallback)
  try {
    const res = await fetch('https://api64.ipify.org?format=json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`ipify responded with ${res.status}`);
    const data = await res.json();

    const result = {
      ip: data.ip,
      type: data.ip.includes(':') ? 'IPv6' : 'IPv4',
      country: '위치 정보 수신 제한됨',
      countryCode: '',
      flag: '🌐',
      region: '정보 없음',
      city: '정보 없음',
      postal: 'N/A',
      latitude: null,
      longitude: null,
      isp: '정보 없음 (기본 IP만 확보)',
      org: '정보 없음',
      asn: 'N/A',
      timezone: 'N/A',
      utcOffset: '',
    };
    renderIPData(result);
    if (typeof showToast === 'function') {
      showToast('상세 위치 정보 API가 차단되어 공인 IP만 표시합니다.', 'info');
    }
    return;
  } catch (err3) {
    console.error('모든 IP 확인 API 호출 실패:', err3.message);
    renderErrorState('공인 IP 정보를 가져올 수 없습니다. 인터넷 연결 또는 광고 차단기 설정을 확인해주세요.');
  } finally {
    setLoadingState(false);
  }
}

// 3. Country Code to Flag Emoji Helper
function getFlagEmoji(countryCode) {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// 4. Loading & Error States
function setLoadingState(isLoading) {
  IPState.isLoading = isLoading;
  const pulseDot = document.getElementById('status-pulse-dot');
  const statusText = document.getElementById('status-text');
  const refreshIcon = document.getElementById('refresh-icon');

  if (pulseDot) {
    pulseDot.className = 'pulse-dot' + (isLoading ? ' loading' : '');
  }
  if (statusText) {
    statusText.textContent = isLoading ? 'IP 및 네트워크 정보 조회 중...' : '정상 연결됨 (온라인)';
  }
  if (refreshIcon) {
    if (isLoading) {
      refreshIcon.classList.add('spinning');
    } else {
      refreshIcon.classList.remove('spinning');
    }
  }
}

function renderErrorState(errorMessage) {
  const pulseDot = document.getElementById('status-pulse-dot');
  const statusText = document.getElementById('status-text');
  const ipDisplay = document.getElementById('ip-address-display');

  if (pulseDot) pulseDot.className = 'pulse-dot error';
  if (statusText) statusText.textContent = '조회 실패';
  if (ipDisplay) ipDisplay.textContent = '조회 실패';

  if (typeof showToast === 'function') {
    showToast(errorMessage, 'info');
  }
}

// 5. IP Classification & Diagnostics Helper
function classifyIP(ip) {
  if (!ip) return '알 수 없음';
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('127.')) {
    return '루프백 (Loopback)';
  }
  // RFC 1918 Private Ranges & APIPA Link-Local
  if (/(^192\.168\.)|(^10\.)|(^172\.(1[6-9]|2\d|3[0-1])\.)|(^169\.254\.)/.test(ip)) {
    return '사설 IP (RFC 1918 Private)';
  }
  return '공인 광대역 (Public Routable)';
}

// WebRTC Local Private IP Detector
function detectLocalPrivateIP(timeoutMs = 3500) {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.RTCPeerConnection) {
      return resolve({
        status: 'unsupported',
        ip: null,
        displayText: 'WebRTC 미지원',
        badgeClass: '',
        note: '브라우저가 WebRTC 기술을 지원하지 않습니다.'
      });
    }

    let resolved = false;
    const foundCandidates = [];

    const finish = (result) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      try {
        if (pc) pc.close();
      } catch (e) {}
      resolve(result);
    };

    const timer = setTimeout(() => {
      if (foundCandidates.length > 0) {
        const mdns = foundCandidates.find(c => c.type === 'mdns');
        if (mdns) {
          return finish({
            status: 'mdns',
            ip: mdns.val,
            displayText: 'mDNS 보호됨 (.local)',
            badgeClass: 'warning',
            note: '브라우저 지문 추적(Fingerprinting) 방지 정책으로 실제 사설 IP 대신 난수화된 mDNS 호스트명이 제공됩니다.'
          });
        }
      }
      finish({
        status: 'not_detected',
        ip: null,
        displayText: '확인 불가 (보안 차단)',
        badgeClass: '',
        note: '브라우저 확장 프로그램 또는 보안 정책에 의해 WebRTC 로컬 IP 조회가 차단되었습니다.'
      });
    }, timeoutMs);

    let pc;
    try {
      pc = new RTCPeerConnection({
        iceServers: [] // 로컬 candidate만 수집
      });

      pc.createDataChannel('local-ip-detect');
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .catch(err => {
          finish({
            status: 'error',
            ip: null,
            displayText: '조회 실패',
            badgeClass: '',
            note: err.message || 'WebRTC Offer 생성 실패'
          });
        });

      pc.onicecandidate = (event) => {
        if (!event || !event.candidate) {
          return;
        }

        const candidateStr = event.candidate.candidate || '';

        // 1. IPv4 사설 대역 매칭
        const ipMatch = candidateStr.match(/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}|169\.254\.\d{1,3}\.\d{1,3})/);
        if (ipMatch) {
          const detectedIp = ipMatch[1];
          finish({
            status: 'success',
            ip: detectedIp,
            displayText: detectedIp,
            badgeClass: 'active',
            note: 'WebRTC P2P Candidate를 통해 로컬 사설망 IP를 감지했습니다.'
          });
          return;
        }

        // 2. mDNS (.local) 매칭
        const mdnsMatch = candidateStr.match(/([a-zA-Z0-9-]+\.local)/);
        if (mdnsMatch) {
          foundCandidates.push({ type: 'mdns', val: mdnsMatch[1] });
        }
      };

      pc.onicegatheringstatechange = () => {
        if (pc && pc.iceGatheringState === 'complete') {
          if (foundCandidates.length > 0) {
            const mdns = foundCandidates.find(c => c.type === 'mdns');
            if (mdns) {
              finish({
                status: 'mdns',
                ip: mdns.val,
                displayText: 'mDNS 보호됨 (.local)',
                badgeClass: 'warning',
                note: '브라우저 지문 추적(Fingerprinting) 방지 정책으로 실제 사설 IP 대신 난수화된 mDNS 호스트명이 제공됩니다.'
              });
              return;
            }
          }
          finish({
            status: 'not_found',
            ip: null,
            displayText: '사설 IP 비노출 (보안 보호)',
            badgeClass: '',
            note: '브라우저가 로컬 IP 후보를 외부에 노출하지 않도록 보호하고 있습니다.'
          });
        }
      };
    } catch (e) {
      finish({
        status: 'error',
        ip: null,
        displayText: '조회 실패',
        badgeClass: '',
        note: e.message || 'WebRTC 연결 생성 불가'
      });
    }
  });
}

// 6. Update Local IP UI State
async function updateLocalIPInfo() {
  const localDot = document.getElementById('local-ip-dot');
  const localBadgeText = document.getElementById('local-ip-badge-text');
  const specLocalIp = document.getElementById('spec-local-ip');
  const specWebrtcStatus = document.getElementById('spec-webrtc-status');
  const copyLocalBtn = document.getElementById('copy-local-ip-btn');

  if (localBadgeText) localBadgeText.textContent = '로컬 IP: 탐색 중...';
  if (localDot) localDot.className = 'tag-dot';

  const result = await detectLocalPrivateIP();
  IPState.localIPData = result;

  if (localDot) {
    localDot.className = 'tag-dot' + (result.badgeClass ? ` ${result.badgeClass}` : '');
  }

  if (result.status === 'success') {
    if (localBadgeText) localBadgeText.textContent = `로컬 IP: ${result.ip}`;
    if (specLocalIp) specLocalIp.innerHTML = `<span class="spec-val-badge" style="color: #10b981;">${result.ip}</span>`;
    if (specWebrtcStatus) specWebrtcStatus.innerHTML = `<span class="spec-val-badge" style="color: #10b981;">감지 완료 (P2P Active)</span>`;
    if (copyLocalBtn) {
      copyLocalBtn.style.display = 'inline-flex';
      copyLocalBtn.title = `로컬 사설 IP [${result.ip}] 복사`;
    }
  } else if (result.status === 'mdns') {
    if (localBadgeText) localBadgeText.textContent = '로컬 IP: mDNS 보호됨';
    if (specLocalIp) specLocalIp.innerHTML = `<span class="spec-val-badge" style="color: #f59e0b;" title="mDNS 식별자: ${result.ip}">mDNS 마스킹됨 (.local)</span>`;
    if (specWebrtcStatus) specWebrtcStatus.innerHTML = `<span class="spec-val-badge">mDNS 프라이버시 보호</span>`;
    if (copyLocalBtn) copyLocalBtn.style.display = 'none';
  } else {
    if (localBadgeText) localBadgeText.textContent = `로컬 IP: ${result.displayText}`;
    if (specLocalIp) specLocalIp.innerHTML = `<span class="spec-val-badge">${result.displayText}</span>`;
    if (specWebrtcStatus) specWebrtcStatus.innerHTML = `<span class="spec-val-badge">차단 또는 미지원</span>`;
    if (copyLocalBtn) copyLocalBtn.style.display = 'none';
  }
}

// 7. Render Data to DOM safely
function renderIPData(data) {
  IPState.ipData = data;

  // Primary Display
  const ipDisplay = document.getElementById('ip-address-display');
  const ipTypeTag = document.getElementById('ip-type-tag');
  const ipCountryTag = document.getElementById('ip-country-tag');

  if (ipDisplay) ipDisplay.textContent = data.ip;
  if (ipTypeTag) ipTypeTag.textContent = data.type;
  if (ipCountryTag) ipCountryTag.textContent = `${data.flag} ${data.country}`;

  // Geo Location Specs
  setSafeText('spec-country', `${data.flag} ${data.country} (${data.countryCode || 'N/A'})`);
  setSafeText('spec-city-region', `${data.city}, ${data.region}`);
  setSafeText('spec-timezone', data.timezone ? `${data.timezone} (${data.utcOffset || 'UTC'})` : 'N/A');

  // Network Specs
  setSafeText('spec-isp', data.isp);
  setSafeText('spec-org', data.org);
  setSafeText('spec-asn', data.asn);

  // Host Domain & IP Classification
  const hostDomain = window.location.hostname || 'localhost';
  setSafeText('spec-host-domain', hostDomain);

  const ipClass = classifyIP(data.ip);
  const specIpClass = document.getElementById('spec-ip-class');
  if (specIpClass) {
    specIpClass.innerHTML = `<span class="spec-val-badge">${ipClass}</span>`;
  }

  // Client Specs
  const client = collectClientEnvironment();
  setSafeText('spec-client-browser', client.browser);
  setSafeText('spec-client-os', client.os);
  setSafeText('spec-client-screen', client.screenRes);
  setSafeText('spec-client-lang', client.language);
  setSafeText('spec-client-protocol', client.protocol);

  // Trigger Local Private IP Detection concurrently
  updateLocalIPInfo();

  // Handle Map availability
  if (data.latitude && data.longitude) {
    showMapSection();
    if (IPState.isMapVisible && IPState.isMapLoaded) {
      renderMap(data.latitude, data.longitude, `${data.city}, ${data.country}`);
    }
  } else {
    hideMapSection();
  }

  setLoadingState(false);
}

// Helper to safely set text content
function setSafeText(elementId, text) {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = text || '-';
  }
}

// 6. Interactive Leaflet Map (On-Demand & Wide-Area Zoom)
function showMapSection() {
  const mapContainer = document.getElementById('map-container');
  if (mapContainer) mapContainer.style.display = 'flex';
}

function hideMapSection() {
  const mapContainer = document.getElementById('map-container');
  if (mapContainer) mapContainer.style.display = 'none';
}

function renderMap(lat, lon, label) {
  const mapElement = document.getElementById('map-element');
  if (!mapElement) return;

  if (typeof L === 'undefined') {
    mapElement.innerHTML = '';
    const notice = document.createElement('div');
    notice.style.padding = '2rem';
    notice.style.textAlign = 'center';
    notice.style.color = 'var(--text-muted)';
    notice.textContent = `위도: ${lat}, 경도: ${lon} (${label})`;
    mapElement.appendChild(notice);
    return;
  }

  try {
    const WIDE_ZOOM_LEVEL = 5; // 한반도 및 인접 권역 전체가 한눈에 들어오는 광역 축척 (기존 11에서 6단계 축소)

    if (!IPState.mapInstance) {
      IPState.mapInstance = L.map('map-element', {
        center: [lat, lon],
        zoom: WIDE_ZOOM_LEVEL,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
      }).addTo(IPState.mapInstance);

      // 정확한 핀 대신 대략적인 ISP 라우터 허브 권역을 나타내는 반투명 원(Circle)
      IPState.mapCircle = L.circle([lat, lon], {
        radius: 45000, // 반경 45km 권역
        color: '#6366f1',
        fillColor: '#818cf8',
        fillOpacity: 0.25,
        weight: 2
      }).addTo(IPState.mapInstance);

      // 중심 지점 서클 마커
      IPState.mapMarker = L.circleMarker([lat, lon], {
        radius: 6,
        color: '#4f46e5',
        fillColor: '#ffffff',
        fillOpacity: 1,
        weight: 2
      }).addTo(IPState.mapInstance);

      const popupContent = `<b>대략적인 네트워크 권역</b><br>${label}<br><span style="font-size:0.75rem;color:#888;">(ISP 라우터 허브 반경 추정치)</span>`;
      IPState.mapMarker.bindPopup(popupContent).openPopup();
      IPState.isMapLoaded = true;
    } else {
      IPState.mapInstance.setView([lat, lon], WIDE_ZOOM_LEVEL);
      if (IPState.mapCircle) {
        IPState.mapCircle.setLatLng([lat, lon]);
      }
      if (IPState.mapMarker) {
        IPState.mapMarker.setLatLng([lat, lon]);
        IPState.mapMarker.bindPopup(`<b>대략적인 네트워크 권역</b><br>${label}<br><span style="font-size:0.75rem;color:#888;">(ISP 라우터 허브 반경 추정치)</span>`).openPopup();
      }
      setTimeout(() => {
        IPState.mapInstance.invalidateSize();
      }, 100);
    }
  } catch (e) {
    console.error('지도 렌더링 중 오류:', e);
  }
}

// 7. Toggle Map Visibility (On-Demand)
function toggleMapVisibility() {
  const placeholder = document.getElementById('map-placeholder');
  const wrapper = document.getElementById('map-wrapper');
  const mapBtnText = document.getElementById('map-btn-text');
  const toggleBtn = document.getElementById('toggle-map-btn');

  if (!placeholder || !wrapper) return;

  IPState.isMapVisible = !IPState.isMapVisible;

  if (IPState.isMapVisible) {
    placeholder.style.display = 'none';
    wrapper.style.display = 'flex';
    if (mapBtnText) mapBtnText.textContent = '지도 닫기';
    if (toggleBtn) toggleBtn.classList.add('active');

    // Load Map if coordinates are ready
    if (IPState.ipData && IPState.ipData.latitude && IPState.ipData.longitude) {
      renderMap(IPState.ipData.latitude, IPState.ipData.longitude, `${IPState.ipData.city}, ${IPState.ipData.country}`);
    }
    if (IPState.mapInstance) {
      setTimeout(() => {
        IPState.mapInstance.invalidateSize();
      }, 150);
    }
  } else {
    placeholder.style.display = 'flex';
    wrapper.style.display = 'none';
    if (mapBtnText) mapBtnText.textContent = '지도로 대략적인 위치 보기';
    if (toggleBtn) toggleBtn.classList.remove('active');
  }
}

function initMapControls() {
  const toggleBtn = document.getElementById('toggle-map-btn');
  const loadBtn = document.getElementById('load-map-btn');

  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleMapVisibility);
  }
  if (loadBtn) {
    loadBtn.addEventListener('click', toggleMapVisibility);
  }
}

// 8. Clipboard Helper & Copy Actions
async function copyToClipboard(text, label, buttonEl) {
  if (!text || text === '-' || text === '조회 실패') {
    if (typeof showToast === 'function') {
      showToast(`복사할 ${label}가 없습니다.`, 'info');
    }
    return;
  }

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    if (buttonEl) {
      const originalHtml = buttonEl.innerHTML;
      buttonEl.innerHTML = '<span>✓</span><span>복사 완료!</span>';
      buttonEl.style.background = 'var(--success-color)';

      setTimeout(() => {
        buttonEl.innerHTML = originalHtml;
        buttonEl.style.background = '';
      }, 2000);
    }

    if (typeof showToast === 'function') {
      showToast(`${label} [${text}] 가 클립보드에 복사되었습니다.`, 'success');
    }
  } catch (err) {
    console.error('클립보드 복사 실패:', err);
    if (typeof showToast === 'function') {
      showToast('클립보드 복사에 실패했습니다.', 'info');
    }
  }
}

function initCopyAction() {
  const copyBtn = document.getElementById('copy-ip-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const ip = IPState.ipData ? IPState.ipData.ip : document.getElementById('ip-address-display')?.textContent?.trim();
      copyToClipboard(ip, '공인 IP 주소', copyBtn);
    });
  }

  const copyLocalBtn = document.getElementById('copy-local-ip-btn');
  if (copyLocalBtn) {
    copyLocalBtn.addEventListener('click', () => {
      const localIp = IPState.localIPData?.ip;
      copyToClipboard(localIp, '로컬 사설 IP 주소', copyLocalBtn);
    });
  }
}

// 9. Refresh Action
function initRefreshAction() {
  const refreshBtn = document.getElementById('refresh-ip-btn');
  if (!refreshBtn) return;

  refreshBtn.addEventListener('click', () => {
    if (IPState.isLoading) return;
    if (typeof showToast === 'function') {
      showToast('IP 및 네트워크 정보를 새로고침합니다...', 'info');
    }
    fetchIPData();
    updateLocalIPInfo();
  });
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initCopyAction();
  initRefreshAction();
  initMapControls();
  fetchIPData();
  updateLocalIPInfo();
});
