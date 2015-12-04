# Qualia-Shortener
A small node app for shortening links. Designed as an experiment micro service for Qualia engines.

Accepts POST requests with new links on an internal port, handles redirects on an external port (which you should proxy)

## Requirements

* Node JS
* MongoDB

## Install it

1. Clone the repo

    ```
    git clone https://github.com/i-DAT-Qualia/Qualia-Shortener.git
    cd Qualia-Shortener
    ```
    
2. Install the dependencies

    ```
    npm install
    ```
    
3. Run the server
    
    ```
    node server.js -m 'mongodb://localhost/data' -e 8888 -i 8889 -r "http://127.0.0.1:8888"
    ```


