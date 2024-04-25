class PresaleHome {
    constructor() {
        //initialize state properties
        this.isInventoryOpen = false;
        this.isGloOpen = false;
        this.isMintPortalOpen = false;
        this.createPresaleHome();
    }

    createPresaleHome() {
        if (this.glo) {
            this.glo.style.display = 'flex';
        } else {
            //home body
            this.glo = document.createElement('div');
            this.glo.className = 'glo';
            this.glo.id = 'glo';
            this.glo.innerText = 'glo';
            document.body.appendChild(this.glo);
            this.glo.addEventListener('click', () => {
                if (this.isGloOpen || this.isInventoryOpen || this.isMintPortalOpen) {
                    this.showPresaleHome();
                } else {
                    this.hidePresaleHome();
                    this.isGloOpen = true;
                    new GloDescription();
                }
                this.updateGloHelperText();
            });

            this.gloHelper = document.createElement('div');
            this.gloHelper.id = 'gloHelper';
            this.gloHelper.className = 'glo-helper';
            this.gloHelper.innerText = '<- HELP';
            document.body.appendChild(this.gloHelper);

            this.presaleHome = document.createElement('div');
            this.presaleHome.id = 'presaleHome';
            this.presaleHome.className = 'presale-home';
            document.body.appendChild(this.presaleHome);

            this.inventory = document.createElement('div');
            this.inventory.id = 'inventory';
            this.inventory.className = 'inventory';
            document.body.appendChild(this.inventory);
            this.inventory.addEventListener('click', () => {
                this.hidePresaleHome();
                this.isInventoryOpen = true;
                this.inventory.style.display = 'none';
                this.inventoryInstance = new Inventory();
                this.updateGloHelperText();
            });

            //top half
            this.presaleHomeTopHalf = document.createElement('div');
            this.presaleHomeTopHalf.className = 'top-half';
            this.presaleHome.appendChild(this.presaleHomeTopHalf);

            this.genesisCaseHome = document.createElement('div');
            this.genesisCaseHome.id = 'genesisCaseHome';
            this.genesisCaseHome.className = 'genesis-case-home';
            this.presaleHomeTopHalf.appendChild(this.genesisCaseHome);
            this.genesisCaseHome.addEventListener('click', () => {
                this.hidePresaleHome();
                this.isMintPortalOpen = true;
                this.genesisCaseInstance = new GenesisCase();
                this.updateGloHelperText();
            });

            //bottom half
            this.presaleHomeBottomHalf = document.createElement('div');
            this.presaleHomeBottomHalf.className = 'bottom-half';
            this.presaleHome.appendChild(this.presaleHomeBottomHalf);

            this.exclusiveItemsContainer = document.createElement('div');
            this.exclusiveItemsContainer.id = 'exclusiveItemsContainer';
            this.exclusiveItemsContainer.className = 'exclusive-items-container';
            this.presaleHomeBottomHalf.appendChild(this.exclusiveItemsContainer);

            for (let i = 0; i < 8; i++) {
                const square = document.createElement('div');
                square.className = 'square';
                square.id = 'square' + (i + 1); // Assigns each square a unique id
                this.exclusiveItemsContainer.appendChild(square);

                // Add event listener to each square
                square.addEventListener('click', () => {
                    this.hidePresaleHome();
                    this.isMintPortalOpen = true;
                    this.exclusiveItemInstance = new ExclusiveItem(i + 1); // Pass the square number to the ExclusiveItem class
                    this.updateGloHelperText();
                });
            }
        }
    }

    updateGloHelperText() {
        if (this.isGloOpen || this.isInventoryOpen || this.isMintPortalOpen) {
            this.gloHelper.innerText = '<- BACK';
        } else {
            this.gloHelper.innerText = '<- HELP';
        }
    }

    showPresaleHome() {
        // Show all elements and update glo button
        this.presaleHome.style.display = 'flex';
        this.inventory.style.display = 'flex';
        this.isInventoryOpen = false;
        this.isGloOpen = false;
        this.isMintPortalOpen = false;

        // Hide other elements if they exist
        if (this.inventoryInstance) {
        this.inventoryInstance.hideInventory();
        }
        if (this.genesisCaseInstance) {
            this.genesisCaseInstance.hideGenesisCase();
        }
        if (this.exclusiveItemInstance) {
            this.exclusiveItemInstance.hideExclusiveItem();
        }
    }

    hidePresaleHome() {
        // Hide all elements except glo
        this.presaleHome.style.display = 'none';
    }
}

class GloDescription {}

class Inventory {
    constructor() {
        this.createInventory();
    }

    createInventory() {
        if(!this.expandedInventory) {
        this.expandedInventory = document.createElement('div');
        this.expandedInventory.id = 'expandedInventory';
        this.expandedInventory.className = 'expanded-inventory';
        document.body.appendChild(this.expandedInventory);
        } else {
            this.expandedInventory.style.display = 'flex';
        }
    }

    hideInventory() {
        this.expandedInventory.style.display = 'none';
    }
}

class GenesisCase {
    constructor() {
        this.createGenesisCase();
    }

    createGenesisCase() {
        if(!this.genesisCasePortal) {
        this.genesisCasePortal = document.createElement('div');
        this.genesisCasePortal.id = 'genesisCasePortal';
        this.genesisCasePortal.className = 'genesis-case-portal';
        document.body.appendChild(this.genesisCasePortal);

        //nft display left half
        const nftDisplay = document.createElement('div');
        nftDisplay.style.flex = '1'; // Take up half the space
        nftDisplay.style.display = 'flex';
        nftDisplay.style.alignItems = 'center';
        nftDisplay.style.justifyContent = 'center';
        this.genesisCasePortal.appendChild(nftDisplay);

            //nft image
            const nftImage = document.createElement('img');
            nftImage.className = 'genesis-image';
            nftDisplay.appendChild(nftImage);

        //nft description right half
        const nftDescription = document.createElement('div');
        nftDescription.style.flex = '1'; // Take up half the space
        this.genesisCasePortal.appendChild(nftDescription);

            //nft title
            const nftTitle = document.createElement('span');
            nftTitle.innerText = 'Genesis Case';
            nftDescription.appendChild(nftTitle);

            //nft supply count and description
            const supplyCount = document.createElement('div');
            supplyCount.innerText = 'TOTAL SUPPLY 1,000';
            nftDescription.appendChild(supplyCount);

            const expandedDescription = document.createElement('span');
            expandedDescription.innerText = 'The genesis case is the first gloNFT lootbox available to early adopters only through the exclusive presale portal for a limited time only';
            nftDescription.appendChild(expandedDescription);

            //nft mint details
            const mintDetails = document.createElement('div');
            nftDescription.appendChild(mintDetails);

                //reiterate nft sale name
                const mintDescription = document.createElement('span');
                mintDescription.innerText = 'glo genesis presale case';
                mintDetails.appendChild(mintDescription);

                //nft price
                const mintPrice = document.createElement('span');
                mintPrice.innerText = '100 LUNA';
                mintDetails.appendChild(mintPrice);

                //nft mint timer
                const mintTimer = document.createElement('span');
                mintTimer.innerText = '3:22:31';
                mintDetails.appendChild(mintTimer);
                
                //wallet limit
                const walletLimit = document.createElement('span')
                walletLimit.innerText = '5 PER WALLET';
                mintDetails.appendChild(walletLimit);

            //nft connect wallet or mint button
            const connectWallet = document.createElement('btn');
            connectWallet.innerText = 'Connect Wallet';
            nftDescription.appendChild(connectWallet);

            //nft supply count
            const supplyContainer = document.createElement('div');
            nftDescription.appendChild(supplyContainer);

                //nft supply counter
                const supplyCounter = document.createElement('div');
                supplyContainer.appendChild(supplyCounter);

                //nft total minted label
                const totalMinted = document.createElement('span');
                totalMinted.innerText = 'Total Minted';
                supplyContainer.appendChild(totalMinted);

                //nft % minted
                const mintedNumbers = document.createElement('span');
                mintedNumbers.innerText = '39% (390/1,000)';
                supplyContainer.appendChild(mintedNumbers);
        } else {
            this.genesisCasePortal.style.display = 'flex';
        }
    }

    hideGenesisCase() {
        this.genesisCasePortal.style.display = 'none';
    }
}

class ExclusiveItem {
    // add this constructor once  squares have explicit  nfts defined
    // constructor(squareNumber) {
           // this.createExclusiveItem(squareNumber);
    //     // Do something with squareNumber
    // }
    constructor() {
        this.createExclusivePortal();
    }

    createExclusivePortal() {
        if(!this.exclusivePortal) {
        this.exclusivePortal = document.createElement('div');
        this.exclusivePortal.id = 'exclusivePortal';
        this.exclusivePortal.className = 'exclusive-portal';
        document.body.appendChild(this.exclusivePortal);

        //nft display left half
        const nftDisplay = document.createElement('div');
        nftDisplay.style.flex = '1'; // Take up half the space
        nftDisplay.style.display = 'flex';
        nftDisplay.style.alignItems = 'center';
        nftDisplay.style.justifyContent = 'center';
        this.exclusivePortal.appendChild(nftDisplay);

            //nft image
            const nftImage = document.createElement('img');
            nftImage.className = 'exclusive-image';
            nftDisplay.appendChild(nftImage);

        //nft description right half
        const nftDescription = document.createElement('div');
        nftDescription.style.flex = '1'; // Take up half the space
        this.exclusivePortal.appendChild(nftDescription);

            //nft title
            const nftTitle = document.createElement('span');
            nftTitle.innerText = 'Exclusive gloNFT';
            nftDescription.appendChild(nftTitle);

            //nft supply count and description
            const supplyCount = document.createElement('div');
            supplyCount.innerText = 'TOTAL SUPPLY 1,000';
            nftDescription.appendChild(supplyCount);

            const expandedDescription = document.createElement('span');
            expandedDescription.innerText = 'These gloNFTs are only exclusively available through the presale portal for a limited time only';
            nftDescription.appendChild(expandedDescription);

            //nft mint details
            const mintDetails = document.createElement('div');
            nftDescription.appendChild(mintDetails);

                //reiterate nft sale name
                const mintDescription = document.createElement('span');
                mintDescription.innerText = 'glo exclusive presale nft';
                mintDetails.appendChild(mintDescription);

                //nft price
                const mintPrice = document.createElement('span');
                mintPrice.innerText = '100 LUNA';
                mintDetails.appendChild(mintPrice);

                //nft mint timer
                const mintTimer = document.createElement('span');
                mintTimer.innerText = '3:22:31';
                mintDetails.appendChild(mintTimer);
                
                //wallet limit
                const walletLimit = document.createElement('span')
                walletLimit.innerText = '5 PER WALLET';
                mintDetails.appendChild(walletLimit);

            //nft connect wallet or mint button
            const connectWallet = document.createElement('btn');
            connectWallet.innerText = 'Connect Wallet';
            nftDescription.appendChild(connectWallet);

            //nft supply count
            const supplyContainer = document.createElement('div');
            nftDescription.appendChild(supplyContainer);

                //nft supply counter
                const supplyCounter = document.createElement('div');
                supplyContainer.appendChild(supplyCounter);

                //nft total minted label
                const totalMinted = document.createElement('span');
                totalMinted.innerText = 'Total Minted';
                supplyContainer.appendChild(totalMinted);

                //nft % minted
                const mintedNumbers = document.createElement('span');
                mintedNumbers.innerText = '39% (390/1,000)';
                supplyContainer.appendChild(mintedNumbers);
        } else {
            this.exclusivePortal.style.display = 'flex';
        }
    }

    hideExclusiveItem() {
        this.exclusivePortal.style.display = 'none';
    }
}

