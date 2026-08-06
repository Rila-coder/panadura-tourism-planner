// public/js/maps-autocomplete.js

// Initialize Google Maps Autocomplete
function initAutocomplete() {
    const input = document.getElementById('location-search');
    if (!input) return;

    const autocomplete = new google.maps.places.Autocomplete(input, {
        types: ['geocode', 'establishment'],
        componentRestrictions: { country: 'LK' } // Sri Lanka
    });

    autocomplete.addListener('place_changed', function() {
        const place = autocomplete.getPlace();
        if (place.geometry) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            
            document.getElementById('add-latitude').value = lat;
            document.getElementById('add-longitude').value = lng;
            document.getElementById('add-address').value = place.formatted_address || '';
            
            // Show success message
            showToast('📍 Location found! Coordinates added automatically.', 'success');
        } else {
            showToast('⚠️ Please select a valid location from the dropdown.', 'error');
        }
    });
}