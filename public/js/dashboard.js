class Home {
    constructor(){
        this.init();
    }

    init(){
        this.getBooks();
    }

    handleAnalytics(){
        const analytics = new Analytics();
        this.homeBtns.remove();
        this.backBtn = document.createElement('button');
        this.backBtn.innerHTML = 'Back';
        this.backBtn.onclick = () => {
            console.log('back clicked');
            this.getBooks();
            this.backBtn.remove();
            document.getElementById('analyticsContainer').remove();
        }
        document.body.appendChild(this.backBtn);
    }

    handleBlockchain(){
        this.homeBtns.remove();
        this.backBtn = document.createElement('button');
        this.backBtn.innerHTML = 'Back';
        this.backBtn.onclick = () => {
            console.log('back clicked');
            this.getBooks();
            this.backBtn.remove();
        }
        document.body.appendChild(this.backBtn);
    }

    getBooks(){ 
        //home button container
        this.homeBtns = document.createElement('div');
        this.homeBtns.style.width = '30%';
        this.homeBtns.style.height = '3%';
        this.homeBtns.style.position = 'absolute';
        this.homeBtns.style.left = '50%';
        this.homeBtns.style.transform = 'translateX(-50%)';
        this.homeBtns.style.top = '50%';
        this.homeBtns.style.display = 'flex';
        this.homeBtns.style.flexDirection = 'row';
        this.homeBtns.style.justifyContent = 'center';
        this.homeBtns.style.gap = '5px';

        document.body.appendChild(this.homeBtns);
        //analytics
        this.analyticsBtn = document.createElement('button');
        this.analyticsBtn.innerHTML = 'Analytics';
        this.analyticsBtn.onclick = () => {
            this.handleAnalytics();
        }
       this.homeBtns.appendChild(this.analyticsBtn);

        //blockchain
        this.blockchainBtn = document.createElement('button');
        this.blockchainBtn.innerHTML = 'Blockchain';
        this.blockchainBtn.onclick = () => {
            this.handleBlockchain();
        }
       this.homeBtns.appendChild(this.blockchainBtn);
    }
}

class Analytics {
    constructor(){
        this.init();
    }

    init(){
        this.getBooks();
        // Create a new style element
        let style = document.createElement('style');

        // Add CSS rules to the style element
        style.innerHTML = `
        .analytics {
            color: grey;
            background-color: lightgrey;
            padding: 10px;
            margin: 10px;
            height: 90%;
            width: 30%;
            text-align: center;
            font-weight: bolder;
            font-size: 20px;
            border-radius: 10px;
        }
        `;

        // Append the style element to the head of the document
        document.head.appendChild(style);
    }

    getBooks(){
        console.log('get books');
        //handle analytics main container
        this.analyticsContainer = document.createElement('div');
        this.analyticsContainer.id = 'analyticsContainer';
        this.analyticsContainer.style.position = 'absolute';
        this.analyticsContainer.style.height = '90%';
        this.analyticsContainer.style.width = '90%';
        this.analyticsContainer.style.left = '50%';
        this.analyticsContainer.style.transform = 'translateX(-50%)';
        this.analyticsContainer.style.top = '5%';
        this.analyticsContainer.style.display = 'flex';
        document.body.appendChild(this.analyticsContainer);

        //handle google analytics
        this.googleAnalytics = document.createElement('div');
        this.googleAnalytics.innerHTML = 'Google Analytics';
        this.googleAnalytics.className = 'analytics';
        this.analyticsContainer.appendChild(this.googleAnalytics);

        //handle user session analytics
        this.userSessionAnalytics = document.createElement('div');
        this.userSessionAnalytics.innerHTML = 'User Session Analytics';
        this.userSessionAnalytics.className = 'analytics';
        this.analyticsContainer.appendChild(this.userSessionAnalytics);

        //handle seo analytics
        this.seoAnalytics = document.createElement('div');
        this.seoAnalytics.innerHTML = 'SEO Analytics';
        this.seoAnalytics.className = 'analytics';
        this.analyticsContainer.appendChild(this.seoAnalytics);
    }
}