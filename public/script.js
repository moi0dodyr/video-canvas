document.addEventListener("DOMContentLoaded", function () {
    var isDragging = false;
    var offsetX, offsetY;

    function saveContainerPositions() {
        var containers = document.querySelectorAll('.container');
        var positions = Array.from(containers).map(function(container) {
            return {
                id: container.id,
                left: container.style.left,
                top: container.style.top
            };
        });
        localStorage.setItem('containerPositions', JSON.stringify(positions));
        saveContainerPositionsToServer(); // Save positions to server
    }    

    function loadContainerPositions() {
        var positions = localStorage.getItem('containerPositions');
        if (positions) {
            positions = JSON.parse(positions);
            positions.forEach(function(position) {
                var container = document.getElementById(position.id);
                if (container) {
                    container.style.left = position.left;
                    container.style.top = position.top;
                }
            });
        }
    }

    function setupContainerEvents(containerDiv) {
        var containerDragging = false;
        var containerOffsetX, containerOffsetY;

        containerDiv.addEventListener("mousedown", function (e) {
            containerDragging = true;
            containerOffsetX = e.clientX - containerDiv.getBoundingClientRect().left;
            containerOffsetY = e.clientY - containerDiv.getBoundingClientRect().top;
        });

        document.addEventListener("mousemove", function (e) {
            if (containerDragging) {
                containerDiv.style.left = e.clientX - containerOffsetX + "px";
                containerDiv.style.top = e.clientY - containerOffsetY + "px";
            }
        });

        document.addEventListener("mouseup", function () {
            containerDragging = false;
            saveContainerPositions();
        });
    }

    function initializeVideoContainer(containerDiv) {
        var videos = containerDiv.querySelectorAll('.video');
        var inputVideo = containerDiv.querySelector('.input-video');
        var resetButton = containerDiv.querySelector('.reset-button');
        var placeholder = containerDiv.querySelector('.placeholder');
    
        // Retrieve the index from the data attribute
        var containerIndex = containerDiv.getAttribute('data-index');
    
        inputVideo.addEventListener('change', function () {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                const video = videos[0];
                video.muted = true;
                const videoSrc = video.querySelector('.video-src');
    
                reader.onload = function (e) {
                    videoSrc.src = e.target.result;
                    video.load();
                    localStorage.setItem(`videoSrc-${containerIndex}`, e.target.result);
                    placeholder.style.display = 'none';
                };
    
                reader.readAsDataURL(this.files[0]);
            }
        });
    
        resetButton.addEventListener('click', function () {
            // Reset the video source
            const video = videos[0];
            video.muted = true;
            const videoSrc = video.querySelector('.video-src');
            videoSrc.src = "";
            video.load();
    
            // Remove the video source from localStorage
            localStorage.removeItem(`videoSrc-${containerIndex}`);
            placeholder.style.display = 'block';
        });
    
        const storedVideoSrc = localStorage.getItem(`videoSrc-${containerIndex}`);
        if (storedVideoSrc) {
            const video = videos[0];
            video.muted = true;
            const videoSrc = video.querySelector('.video-src');
            videoSrc.src = storedVideoSrc;
            video.load();
            // Add 'canplay' event listener to start video playback after user interaction
            video.addEventListener('canplay', function () {
                setTimeout(function () {
                    video.play().catch(function (error) {
                        console.error('Error playing video:', error);
                    });
                }, 500); // Add a small delay to ensure video playback starts smoothly
            }, { once: true });
            placeholder.style.display = 'none';
        } else {
            placeholder.style.display = 'block';
        }
    }

    function saveContainerPositionsToServer() {
        var containers = document.querySelectorAll('.container');
        var positions = Array.from(containers).map(function(container) {
            return {
                id: container.id,
                left: container.style.left,
                top: container.style.top
            };
        });

        fetch('/saveContainerPositions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ positions }),
        });
    }

    function loadContainerPositionsFromServer() {
        return fetch('/loadContainerPositions')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(positions => {
                if (positions) {
                    positions.forEach(position => {
                        var container = document.getElementById(position.id);
                        if (container) {
                            // If the container already exists, update its position
                            container.style.left = position.left;
                            container.style.top = position.top;
                        } else {
                            // If the container does not exist, create a new one
                            var newContainer = document.createElement("div");
                            newContainer.className = "container";
                            newContainer.id = position.id;
                            newContainer.style.left = position.left;
                            newContainer.style.top = position.top;
    
                            newContainer.innerHTML = `
                            <div class="video-container">
                                <video class="video" loop autoplay>
                                    <source src="" class="video-src" type="video/mp4">
                                </video>
                            </div>
                            <input type="file" class="input-video" accept="video/*">
                            <div class="reset-button">Reset</div>
                            <div class="placeholder">Empty Container</div>
                        `;
                        
                        document.body.appendChild(newContainer);
                        setupContainerEvents(newContainer);
                        initializeVideoContainer(newContainer); // Remove the second argument (containerIndex)                        
                        }
                    });
                }
            })
            .catch(error => {
                console.error('Error loading container positions from server:', error);
                throw error; // Re-throw the error to handle it in the calling function
            });
    }    

    var addButton = document.createElement("button");
    addButton.textContent = "Add Container";
    addButton.id = "addButton";
    document.body.appendChild(addButton);

    addButton.addEventListener("click", function () {
        var containerIndex = document.querySelectorAll('.container').length;
        var existingContainer = document.getElementById(`container-${containerIndex}`);
        
        if (!existingContainer) {
            var newContainer = document.createElement("div");
            newContainer.className = "container";
            newContainer.id = `container-${containerIndex}`;
            newContainer.setAttribute('data-index', containerIndex); // Store the index as a data attribute
            newContainer.style.left = "0"; // Adjust initial position
    
            newContainer.innerHTML = `
                <div class="video-container">
                    <video class="video" loop autoplay>
                        <source src="" class="video-src" type="video/mp4">
                    </video>
                </div>
                <input type="file" class="input-video" accept="video/*">
                <div class="reset-button">Reset</div>
                <div class="placeholder">Empty Container</div>
            `;
    
            document.body.appendChild(newContainer);
            setupContainerEvents(newContainer);
            initializeVideoContainer(newContainer);
            saveContainerPositionsToServer(); // Save positions to server when adding a new container
        } else {
            console.warn(`Container with ID 'container-${containerIndex}' already exists.`);
        }
    });    

    loadContainerPositions(); // Load container positions on page load
    loadContainerPositionsFromServer(); // Load positions from server on page load
});
