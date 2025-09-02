document.addEventListener('DOMContentLoaded', function () {
    // --- MOBILE LAYOUT HANDLING ---
    function handleMobileLayout() {
        if (window.innerWidth <= 768) {
            const hero = document.querySelector('.hero');
            const finalHero = document.querySelector('.hero:last-of-type');
            const storyContainer = document.querySelector('.story-container');
            const mapContainer = document.querySelector('.map-container');
            const timelineContainer = document.querySelector('.timeline-container');
            
            function updateMobileLayout() {
                const heroBottom = hero.offsetTop + hero.offsetHeight;
                const storyBottom = storyContainer.offsetTop + storyContainer.offsetHeight;
                const finalHeroTop = finalHero ? finalHero.offsetTop : 0;
                const scrollTop = window.pageYOffset;
                
                // Add some buffer to prevent infinite scroll issues
                const buffer = 50;
                
                // Check if we've scrolled past the story content (near final hero)
                if (scrollTop >= (storyBottom - buffer)) {
                    // Hide fixed layout to allow access to final hero
                    mapContainer.style.display = 'none';
                    timelineContainer.style.display = 'none';
                    console.log('Showing final hero section - scrollTop:', scrollTop, 'storyBottom:', storyBottom);
                } else if (scrollTop >= (heroBottom - buffer)) {
                    // Show fixed layout after first hero
                    mapContainer.style.position = 'fixed';
                    mapContainer.style.top = '0';
                    mapContainer.style.zIndex = '10';
                    mapContainer.style.display = 'block';
                    timelineContainer.style.position = 'fixed';
                    timelineContainer.style.bottom = '0';
                    timelineContainer.style.zIndex = '5';
                    timelineContainer.style.height = '50vh';
                    timelineContainer.style.overflowY = 'auto';
                    timelineContainer.style.display = 'block';
                    console.log('Showing story sections');
                } else {
                    // Normal layout when in first hero
                    mapContainer.style.position = 'relative';
                    mapContainer.style.top = 'auto';
                    mapContainer.style.zIndex = 'auto';
                    mapContainer.style.display = 'block';
                    timelineContainer.style.position = 'relative';
                    timelineContainer.style.bottom = 'auto';
                    timelineContainer.style.zIndex = 'auto';
                    timelineContainer.style.height = '50vh';
                    timelineContainer.style.overflowY = 'auto';
                    timelineContainer.style.display = 'block';
                    console.log('In first hero section');
                }
            }
            
            // Throttle function to prevent excessive scroll events
            let scrollTimeout;
            function throttledUpdateMobileLayout() {
                if (scrollTimeout) {
                    clearTimeout(scrollTimeout);
                }
                scrollTimeout = setTimeout(updateMobileLayout, 10);
            }
            
            // Initial check
            updateMobileLayout();
            
            // Update on scroll with throttling
            window.addEventListener('scroll', throttledUpdateMobileLayout);
            window.addEventListener('resize', updateMobileLayout);
        }
    }
    
    // Initialize mobile layout handling
    handleMobileLayout();

    // --- MAP INITIALIZATION ---
    // Using OpenStreetMap tiles
    const map = L.map('map').setView([20.5937, 78.9629], 4); // Centered on India
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map);

    const chapters = document.querySelectorAll('.chapter');
    let markers = []; // To hold current markers
    let lines = []; // To hold current lines

    // --- CUSTOM AVATAR ICONS ---
    const createAvatarIcon = (name, isWife = false) => {
        const colors = isWife ? ['#ff6b9d', '#ff8fab', '#ffb3c1'] : ['#4ecdc4', '#45b7aa', '#3da89b'];
        const emoji = isWife ? '👩‍🦰' : '👨‍🦱';
        
        return L.divIcon({
            html: `
                <div class="avatar-marker ${isWife ? 'wife' : 'husband'}">
                    <div class="avatar-circle" style="background: linear-gradient(135deg, ${colors[0]}, ${colors[1]})">
                        <span class="avatar-emoji">${emoji}</span>
                    </div>
                    <div class="avatar-name">${name}</div>
                </div>
            `,
            className: 'custom-avatar-icon',
            iconSize: [80, 100],
            iconAnchor: [40, 80],
            popupAnchor: [0, -80]
        });
    };

    // --- FUNCTION TO UPDATE MAP ---
    function updateMap(chapter) {
        // Clear previous markers and lines
        markers.forEach(marker => map.removeLayer(marker));
        lines.forEach(line => map.removeLayer(line));
        markers = [];
        lines = [];

        const lat1 = parseFloat(chapter.dataset.lat1);
        const lon1 = parseFloat(chapter.dataset.lon1);
        const city1 = chapter.dataset.city1;
        
        const lat2 = parseFloat(chapter.dataset.lat2);
        const lon2 = parseFloat(chapter.dataset.lon2);
        const city2 = chapter.dataset.city2;
        
        const zoom = parseInt(chapter.dataset.zoom);
        
        const locations = [];

        // Helper function to determine if a location belongs to the wife
        const isWifeLocation = (cityName) => {
            const city = cityName.toLowerCase();
            return city.includes('you') || 
                   city.includes('wife') || 
                   city.includes('hyderabad') ||
                   city.includes('ongole') ||
                   city.includes('together') ||
                   city.includes('both');
        };

        // Helper function to determine if a location belongs to the husband
        const isHusbandLocation = (cityName) => {
            const city = cityName.toLowerCase();
            return city.includes('me') || 
                   city.includes('mahabubabad') ||
                   city.includes('roorkee') ||
                   city.includes('delhi') ||
                   city.includes('san francisco') ||
                   city.includes('santa barbara') ||
                   city.includes('pittsburgh') ||
                   city.includes('california');
        };

        // Determine if this is a single location scenario
        const hasSecondLocation = lat2 && lon2 && !isNaN(lat2) && !isNaN(lon2);
        const isSameLocation = hasSecondLocation && 
                              Math.abs(lat1 - lat2) < 0.001 && 
                              Math.abs(lon1 - lon2) < 0.001;
        const isSingleLocation = !hasSecondLocation || isSameLocation;

        if (isSingleLocation) {
            // Single location - show both avatars with slight offset
            const offset1 = 0.002;
            const offset2 = -0.002;
            
            // Husband avatar
            const husbandIcon = createAvatarIcon(city1, false);
            const husbandMarker = L.marker([lat1 + offset1, lon1 + offset1], { icon: husbandIcon }).addTo(map).bindPopup(city1);
            markers.push(husbandMarker);
            locations.push([lat1 + offset1, lon1 + offset1]);
            
            // Wife avatar
            const wifeIcon = createAvatarIcon(city1, true);
            const wifeMarker = L.marker([lat1 + offset2, lon1 + offset2], { icon: wifeIcon }).addTo(map).bindPopup(city1);
            markers.push(wifeMarker);
            locations.push([lat1 + offset2, lon1 + offset2]);
            
            // For single locations, zoom in close
            if (zoom) {
                map.flyTo([lat1, lon1], zoom, { duration: 2.5 });
            } else {
                map.flyTo([lat1, lon1], 13, { duration: 2.5 });
            }
            
        } else {
            // Two different locations
            // First marker
            const isWife1 = isWifeLocation(city1);
            const isHusband1 = isHusbandLocation(city1);
            const shouldBeWife1 = isWife1 && !isHusband1;
            const markerIcon1 = createAvatarIcon(city1, shouldBeWife1);
            
            const marker1 = L.marker([lat1, lon1], { icon: markerIcon1 }).addTo(map).bindPopup(city1);
            markers.push(marker1);
            locations.push([lat1, lon1]);
            
            // Second marker
            const isWife2 = isWifeLocation(city2);
            const isHusband2 = isHusbandLocation(city2);
            const shouldBeWife2 = isWife2 && !isHusband2;
            const markerIcon2 = createAvatarIcon(city2, shouldBeWife2);
            
            const marker2 = L.marker([lat2, lon2], { icon: markerIcon2 }).addTo(map).bindPopup(city2);
            markers.push(marker2);
            locations.push([lat2, lon2]);
            
            // Draw connecting line
            const line = L.polyline(locations, { 
                color: '#a55a4f', 
                weight: 3,
                dashArray: '10, 10',
                opacity: 0.8
            }).addTo(map);
            lines.push(line);
            
            // Add distance information
            const distance = calculateDistance(lat1, lon1, lat2, lon2);
            const midPoint = [(lat1 + lat2) / 2, (lon1 + lon2) / 2];
            const distanceLabel = L.divIcon({
                html: `<div style="background: white; padding: 5px 10px; border: 2px solid #a55a4f; border-radius: 15px; font-weight: bold; color: #a55a4f; font-size: 12px;">${distance}</div>`,
                className: 'distance-label'
            });
            const distanceMarker = L.marker(midPoint, { icon: distanceLabel }).addTo(map);
            markers.push(distanceMarker);
            
            // For two locations, fit both with padding
            map.flyToBounds(locations, {
                padding: [100, 100],
                duration: 2.5
            });
        }
    }

    // --- FUNCTION TO CALCULATE DISTANCE ---
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        if (distance < 1) {
            return `${Math.round(distance * 1000)}m`;
        } else if (distance < 100) {
            return `${Math.round(distance)}km`;
        } else {
            return `${Math.round(distance)}km`;
        }
    }

    // --- INTERSECTION OBSERVER ---
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            const chapterId = entry.target.id;
            const chapterElement = document.getElementById(chapterId);

            if (entry.isIntersecting) {
                // Highlight the active chapter and update the map
                document.querySelectorAll('.chapter').forEach(c => c.classList.remove('active'));
                chapterElement.classList.add('active');
                updateMap(chapterElement);
            }
        });
    }, {
        rootMargin: window.innerWidth <= 768 ? '-25% 0px -25% 0px' : '-50% 0px -50% 0px',
        threshold: 0
    });

    // Observe each chapter
    chapters.forEach(chapter => {
        observer.observe(chapter);
    });
    
    // Trigger the first chapter's map on load
    if(chapters.length > 0) {
        updateMap(chapters[0]);
        chapters[0].classList.add('active');
        
        // Debug: Log all chapters to see if they're being detected
        console.log('Total chapters found:', chapters.length);
        chapters.forEach((chapter, index) => {
            console.log(`Chapter ${index + 1}:`, chapter.id, 'visible:', chapter.offsetHeight > 0);
        });
        
        // Debug: Log layout elements
        if (window.innerWidth <= 768) {
            const hero = document.querySelector('.hero');
            const finalHero = document.querySelector('.hero:last-of-type');
            const storyContainer = document.querySelector('.story-container');
            console.log('Hero bottom:', hero.offsetTop + hero.offsetHeight);
            console.log('Story bottom:', storyContainer.offsetTop + storyContainer.offsetHeight);
            console.log('Final hero exists:', !!finalHero);
            if (finalHero) {
                console.log('Final hero position:', finalHero.offsetTop);
                console.log('Final hero height:', finalHero.offsetHeight);
                console.log('Final hero display:', window.getComputedStyle(finalHero).display);
                console.log('Final hero visibility:', window.getComputedStyle(finalHero).visibility);
            }
        }
    }
});