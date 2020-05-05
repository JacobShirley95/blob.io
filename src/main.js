const Phaser = require("phaser");

const { ClientNetwork } = require("./backend/network");

module.exports = class MainGame extends Phaser.Scene {
    constructor()
    {
        super({key: "main_game"});
        this.velocity = { x: 0, y: 0 };
        this.speedBoost = false;
        this.state = {};
        this.players = {};
        this.playersText = {};
        this.food = [];
        this.projectiles = [];
        this.init = false;
        this.network = new ClientNetwork();
    }

    preload() {
        
    }

    create(data) {
        this.network.queue({ cmd: "SPAWN", colour: data.colour, name: data.name });

        let centre = new Phaser.Math.Vector2(this.cameras.main.centerX, this.cameras.main.centerY);

        this.input.on('pointermove', (e) => {
            this.velocity = (new Phaser.Math.Vector2(e.x, e.y)).subtract(centre);
        });
        
        this.input.on('pointerdown', (e) => {
            this.speedBoost = true;
        });

        this.input.on('pointerup', (e) => {
            this.speedBoost = false;
        });

        this.input.keyboard.on('keydown-SPACE', (e) => {
            this.network.queue({ cmd: "SHOOT" });
        });
    }

    update() {
        //this.circle.body.setVelocity(this.velocity.x, this.velocity.y);
        let network = this.network;

        const MAX_RADIUS_BEFORE_ZOOMING = 100;

        if (network instanceof ClientNetwork) {
            let myPlayer = this.players[this.state.id];

            if (myPlayer) {
                network.queue({ cmd: "SET_VELOCITY", velocity: this.velocity, speedBoost: this.speedBoost });
            }

            network.flush();
            network.update();

            while (network.received.length) {
                let msg = network.received.shift();
                //console.log(msg);

                if (msg.cmd === "STATE") {
                    let { food, players, projectiles } = msg.state;
                    this.state = msg.state;
                    //console.log(msg);

                    for (let f of food) {
                        const { x, y, colour, radius } = f;
                        let obj = this.add.circle(x, y, radius, colour);

                        this.physics.add.existing(obj);

                        this.food.push(obj);
                    }

                    for (let f of projectiles) {
                        const { x, y, colour, radius } = f;
                        let obj = this.add.circle(x, y, radius, colour);

                        this.physics.add.existing(obj);

                        this.projectiles.push(obj);
                    }

                    for (let p of Object.keys(players)) {
                        const { x, y, colour, radius, name } = players[p];
                        let obj = this.add.circle(x, y, radius, colour);
                        
                        //console.log(text);

                        this.physics.add.existing(obj);

                        this.players[p] = obj;

                        let text = this.add.text(x, y, name, {font:"16px Arial"});

                        text.setDisplayOrigin(text.width / 2, text.height / 2);
                        this.playersText[p] = text;
                    }

                    this.cameras.main.startFollow(this.players[this.state.id]);
                    this.init = true;
                } else if (this.init) {
                    if (msg.cmd === "UPDATE") {
                        let { player } = msg;
                        this.state.players[player.id] = player;
                        //console.log(this.players[player.id]);

                        this.players[player.id].setRadius(player.radius);
                        this.players[player.id].setPosition(player.x, player.y);
                        this.playersText[player.id].setPosition(player.x, player.y);
                    } else if (msg.cmd === "UPDATE_PROJECTILE") {
                        let { projectile, i} = msg;
                        this.state.projectiles[i] = projectile;
                        //console.log(this.players[player.id]);

                        this.projectiles[i].setPosition(projectile.x, projectile.y);
                    } else if (msg.cmd === "DESTROY_FOOD") {
                        let { index } = msg;
                        //console.log(this.players[player.id]);
                        this.food = this.food.filter((f, i) => {
                            if (i === index) {
                                f.destroy();
                                return false;
                            }
                            return true;
                        });
                    } else if (msg.cmd === "DESTROY_PROJECTILE") {
                        let { index } = msg;
                        //console.log(this.players[player.id]);
                        this.projectiles = this.projectiles.filter((f, i) => {
                            if (i === index) {
                                f.destroy();
                                return false;
                            }
                            return true;
                        });
                    } else if (msg.cmd === "SET_PLAYER_RADIUS") {
                        let { id, radius } = msg;
                        //this.state.players[id].radius = radius;
                        //console.log(this.players[player.id]);
                        this.players[id].setRadius(radius);
                    } else if (msg.cmd === "DESTROY_PLAYER") {
                        let { id, cause } = msg;
                    
                        this.players[id].destroy();
                        this.playersText[id].destroy();
                        delete this.players[id];
                        delete this.playersText[id];
                        delete this.state.players[id];

                        if (!this.players[this.state.id] && cause) {
                           // this.cameras.main.startFollow(this.players[cause]);
                        }
                    } else if (msg.cmd === "CREATE_FOOD") {
                        const { x, y, radius, colour } = msg;
                        let obj = this.add.circle(x, y, radius, colour);

                        this.physics.add.existing(obj);

                        this.food.push(obj);
                    } else if (msg.cmd === "CREATE_PLAYER") {
                        const { id, x, y, radius, colour, name } = msg.player;

                        if (this.players[id])
                            continue;

                        let obj = this.add.circle(x, y, radius, colour);

                        this.physics.add.existing(obj);

                        this.players[id] = obj; 

                        let text = this.add.text(x, y, name || "U WOT", {font:"16px Arial"});

                        text.setDisplayOrigin(name.length * 3, 8);
                        this.playersText[id] = text;
                    } else if (msg.cmd === "SPAWN_PROJECTILE") {
                        const { x, y, radius, colour } = msg;
                        console.log("SDFSDF", x, y);
                        let obj = this.add.circle(x, y, radius, colour);

                        this.physics.add.existing(obj);

                        this.projectiles.push(obj);

                        //this.food.push(obj);
                    } else if (msg.cmd === "CURRENT_WORLD_MASS") {
                        console.log(msg.mass);
                    }
                }
            }

            myPlayer = this.players[this.state.id];

            if (myPlayer && myPlayer.radius > MAX_RADIUS_BEFORE_ZOOMING) {
                this.cameras.main.setZoom(1 / (myPlayer.radius / MAX_RADIUS_BEFORE_ZOOMING));
            }
        }
        //this.circle.body.setVelocity(this.velocity.x, this.velocity.y);
        this.children.list.forEach(c => {
            if (typeof c.radius === "undefined")
                return c.setDepth(999999999999);

            c.setDepth(c.radius * c.scale);
        });

        
    }
}