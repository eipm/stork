// Env variables
const maxImagesPermitted = 7;
const baseApiUrl = 'api'
// End Env variables

let token = getCookie('stork-auth');
checkTokenAndRedirectIfEmpty();

setInterval(function(){
    checkTokenAndRedirectIfEmpty();
}, 5000);

function checkTokenAndRedirectIfEmpty() {
    token = getCookie('stork-auth');
    if (window.location.pathname !== '/login' && token === '') {
        window.location.href = '/login';
    }
}

function login(event) {
    postLoginData(event.srcElement.username.value, event.srcElement.password.value, baseApiUrl);
}

function postLoginData(username, password, baseApiUrl) {
    let xhr = new XMLHttpRequest();
    xhr.open('POST', `${baseApiUrl}/login`, true);
    let formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    xhr.onload = (e) => {
        if (xhr.status === 200) {
            window.location.href = '/';
        } else {
            document.getElementById('login-form-username-password-error').classList.remove('hidden');
        }
    };
    xhr.onerror = (e) => alert('An error occurred!');
    xhr.send(formData);
}

const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', (event) => { 
        event.preventDefault();
        login(event);
    })
}

function getCookie(cookieName) {
    var name = cookieName + '=';
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return '';
}

function average(array) {
    return array.reduce((a,b) => a + b, 0) / array.length;
}

function isAnImage(file) {
    if (file && file.type) {
        return file.type.startsWith('image/');
    }

    return false;
};

function getFormData(files) {
    const formData = new FormData();
    for (const file of files) {
        if (isAnImage(file)) {
            formData.append('image', file, file.name);
        }
    }

    return formData;
};

function calculateMajorVoteResult() {
    const currentImagesLength = Object.keys(currentImages).length;
    if (currentImagesLength === 0) {
        return null;
    }

    const goodResults = [], poorResults = [];
    for (const x of Object.keys(currentImages)) {
        if (Number(currentImages[x].result.Good) > Number(currentImages[x].result.Poor)) {
            goodResults.push(currentImages[x]);
        } else {
            poorResults.push(currentImages[x])
        }
    }

    let result = 'Unclear';
    if (goodResults.length < currentImagesLength / 2) {
        result = 'Poor';
    } else if ((goodResults.length > currentImagesLength / 2)) {
        result = 'Good';
    } else {
        const averageGood = average(goodResults.map(x => Number(x.result.Good)));
        const averagePoor = average(poorResults.map(x => Number(x.result.Poor)));
        if (averageGood > averagePoor) {
            result = 'Good';
        } else if  (averageGood < averagePoor) {
            result = 'Poor';
        }
    }

    return result;
};

function updateResultsUI(result) {
    if (result) {
        results.getElementsByTagName('strong')[0].innerHTML = result;
        results.classList.remove('hidden');
    } else {
        results.classList.add('hidden');
    }
};

function postFormData(formData, baseApiUrl) {
    let xhr = new XMLHttpRequest();
    xhr.open('POST', `${baseApiUrl}/upload`, true);
    xhr.setRequestHeader('Authorization','Basic ' + token);

    var loaders = [...document.getElementsByClassName('loader')];
    xhr.onload = function (e) {
        loaders.map(x => x.classList.add('hidden'));
        if (xhr.status === 200) {
            response = JSON.parse(e.target.response);
            Object.keys(response).map(fileName => {
                currentImages[fileName].result = response[fileName];
                const card = document.getElementById(`image-card-${fileName}`);
                const bar = card.getElementsByClassName('bar')[0];
                const goodText = card.getElementsByClassName('good-text')[0];
                const poorText = card.getElementsByClassName('poor-text')[0];
                const goodPercentage = (response[fileName].Good * 100).toFixed(2);
                const poorPercentage = (response[fileName].Poor * 100).toFixed(2);
                bar.setAttribute('style', `width:${goodPercentage}%;`);
                bar.innerHTML = `&nbsp;`;
                goodText.innerHTML = `${goodPercentage}%`;
                poorText.innerHTML = `${poorPercentage}%`;
                const result = card.getElementsByClassName('results')[0];
                result.classList.remove('hidden');
            });
            // updateResultsUI(calculateMajorVoteResult());
        } else {
            alert('An error occurred!');
        }
    };
    xhr.onerror = () => {
        loaders.map(x => x.classList.add('hidden'));
    };

    xhr.send(formData);
};

function removeImageCard(imageName) {
    const card = document.getElementById(`image-card-${imageName}`);
    imagesPlaceholder.removeChild(card);
    delete currentImages[imageName];
    imageRemovedUpdateUI();
    updateResultsUI(calculateMajorVoteResult());
};

function imageRemovedUpdateUI() {
    addImagesButton.classList.remove('disabled');
    if (Object.keys(currentImages).length === 0) {
        clearAllButton.classList.add('disabled');
    }
};

function imageAddedUpdatedUI(numberOfImagesIfAccepted, maxImagesPermitted) {
    if (numberOfImagesIfAccepted > maxImagesPermitted) {
        errorMessage.classList.remove('hidden');
    } else {
        errorMessage.classList.add('hidden');
        clearAllButton.classList.remove('disabled');
        if (numberOfImagesIfAccepted === maxImagesPermitted) {
            addImagesButton.classList.add('disabled');
        }
    }
};

function clearAllImageCards() {
    Object.keys(currentImages).map(image => {
        removeImageCard(image)
    });
};

function createImagesUIFromFiles(files, imagesPlaceholder) {
    if (files === null || files === undefined || imagesPlaceholder === null || imagesPlaceholder === undefined) {
        return;
    }

    for (var file of files) {
        const imagePlaceholder = document.createElement('div');
        imagePlaceholder.classList.add('image-card');
        imagePlaceholder.id = `image-card-${file.name}`;
        imagePlaceholder.innerHTML = `
            <div class="card image-container">
                <div class="card-image">
                    <img alt="${file.name}" width="330px" />
                </div>
                <div class="card-file-name">${file.name}</div>
                
                <div class="loader"></div> 
                <div class="delete-image-button" onclick="removeImageCard('${file.name}')">
                    <i class="material-icons">clear</i>
                </div>
                <div class="results card-content hidden">
                    <div class="poor">
                        <div class="good bar"></div>
                    </div>
                    <div class="legend-item"><div class="legend-marker good"></div>Good: <span class="good-text"></span></div>
                    <div class="legend-item"><div class="legend-marker poor"></div>Poor: <span class="poor-text"></span></div>
                </div>
            </div>`;
        imagesPlaceholder.appendChild(imagePlaceholder);

        const image = imagePlaceholder.getElementsByTagName('img')[0];
        const reader = new FileReader();
        reader.onload = function (e) {
            image.setAttribute('src', e.target.result);
        };

        reader.readAsDataURL(file);
    }
};

function submit(images, baseApiUrl) {
    postFormData(getFormData(images), baseApiUrl);
};

function handleFiles(files, baseApiUrl) {
    if (files && files.length) {
        const images = [...files].filter(file => isAnImage(file));
        let numberOfcurrentImages = Object.keys(currentImages).length;
        const imagesToSend = [];
        (images).map(image => {
            if (typeof(currentImages[image.name]) === 'undefined') {
                imagesToSend.push(image);
            }
        });

        const numberOfImagesIfAccepted = imagesToSend.length + numberOfcurrentImages;
        imageAddedUpdatedUI(numberOfImagesIfAccepted, maxImagesPermitted);
        if (numberOfImagesIfAccepted <= maxImagesPermitted) {
            imagesToSend.map(image => { currentImages[image.name] = image; });
            createImagesUIFromFiles(imagesToSend, imagesPlaceholder);
            submit(imagesToSend, baseApiUrl);
        }
    }
};

function dropHandler(event) {
    handleFiles(event.dataTransfer.files, baseApiUrl);
};

function preventDefaults (e) {
    e.preventDefault();
    e.stopPropagation();
}

const form = document.getElementById('file-form');
const errorMessage = document.getElementById('error-message');
const currentImages = {};
const addImagesButton = document.getElementById('add-images-button');
const results = document.getElementById('results-placeholder');
const fileSelect = document.getElementById('file-select');
if (fileSelect) {
    fileSelect.value = '';
    fileSelect.addEventListener('change', function(e) {
        handleFiles(e.target.files, baseApiUrl);
    });
}

const clearAllButton = document.getElementById('clear-all-button');
if (clearAllButton) {
    clearAllButton.addEventListener('click', () => { clearAllImageCards(); } );
}

const imagesPlaceholder = document.getElementById('imageCards-placeholder');
if (imagesPlaceholder) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        imagesPlaceholder.addEventListener(eventName, preventDefaults, false);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        imagesPlaceholder.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        imagesPlaceholder.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight(e) {
        imagesPlaceholder.classList.add('highlight');
    };
    
    function unhighlight(e) {
        imagesPlaceholder.classList.remove('highlight');
    };
    
}
