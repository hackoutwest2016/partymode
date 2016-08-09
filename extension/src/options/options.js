// Save options to chrome storage
function save_options() {
    var token = document.getElementById('token').value;
    chrome.storage.sync.set({
        userToken: token,
    },
    function() {
        var status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(function() {
            status.textContent = '';
        }, 750);
    });
}

document.getElementById('save').addEventListener('click',save_options);
