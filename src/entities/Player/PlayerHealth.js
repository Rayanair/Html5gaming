import Component from "../../Component";

export default class PlayerHealth extends Component{
    constructor(){
        super();

        this.health = 10;
    }

    TakeHit = e =>{
        this.health = Math.max(0, this.health - 10);
        this.uimanager.SetHealth(this.health);
        if (this.health === 0) {
            // Afficher l'écran "Game Over"
            const gameOverElement = document.querySelector('.gameover');
            if (gameOverElement) {
                gameOverElement.style.visibility = 'visible';
            }
        }
    }

    Initialize(){
        this.uimanager = this.FindEntity("UIManager").GetComponent("UIManager");
        this.parent.RegisterEventHandler(this.TakeHit, "hit");
        this.uimanager.SetHealth(this.health);
    }

}