const HEADER_TEXT = {font:"24px Arial", color: "#000000"};
const ITEM_TEXT = {font:"16px Arial", color: "#000000"};

module.exports = class HUD extends Phaser.Scene {
    constructor() {
        super({key: "hud"});
        this.playersCache = {};
    }

    init(data) {
            
    }

    preload() {
        
    }

    create(data) {
        this.playerScoreboard = [];

        let x = this.game.renderer.width - 200;
        let y = 10;
        this.add.text(x, y, "Scoreboard", HEADER_TEXT);

        this.scoreText = this.add.text(20, this.game.renderer.height - 50, "Size: ", HEADER_TEXT);

        for (let i = 1; i <= 10; i++) {
            this.playerScoreboard.push(this.add.text(x, y + 20 + (i * 30), `${i}:`,ITEM_TEXT));
        }
    }

    getRadiiOfPlayers() {
        let players = this.registry.get("players") || {};
        return Object.keys(players).map(p => ({name: players[p].name, radius: Math.round(players[p].radius)}));
    }

    update() {
        let players = this.registry.get("players") || {};
        let myPlayerId = this.registry.get("myPlayerId");
        let radii = this.getRadiiOfPlayers();

        if (typeof myPlayerId !== "undefined" && players[myPlayerId])
            this.scoreText.setText("Score: " + Math.round(players[myPlayerId].radius));

        if (JSON.stringify(radii) != JSON.stringify(this.playersCache)) {
            this.playersCache = radii;

            radii.sort((a, b) => b.radius - a.radius);

            let x = this.game.renderer.width - 200;
            let y = 10;

            for (let [i, p] of radii.entries()) {
                if (i >= 10)
                    continue;
                    
                this.playerScoreboard[i].setText(`${p.name}: ${p.radius}`);
                this.playerScoreboard[i].visible = true;
            }

            for (let i = radii.length; i < this.playerScoreboard.length; i++) {
                this.playerScoreboard[i].visible = false;
            }
        }
    }
}