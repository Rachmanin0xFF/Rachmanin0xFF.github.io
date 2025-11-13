// Just a point in space.
class Node {
    constructor(x_pos, y_pos) {
        this.x = x_pos;
        this.y = y_pos;
    }
    display() {
        ellipse(this.x, this.y, 10, 10);
    }
}

// Supports:
//      -Resistors  (R)
//      -Capacitors (C)
//      -Inductors  (L)
//      -Wires      (W)
//
// Could be easily set up to handle other linear impedances.
//
class Edge {
    // Can be "R", "W", "C", "L"
    constructor(id_i, id_j, component_type, component_value) {
        this.i = id_i;
        this.j = id_j;
        this.type = component_type;
        this.value = component_value;
    }
    get_impedance(w) {
        switch(this.type) {
            case "R":
                return Z_resistor(w, this.value);
            case "L":
                return Z_inductor(w, this.value);
            case "C":
                return Z_capacitor(w, this.value);
            case "W":
                return Z_wire();
            default:
                break;
        }
    }
    display(nodelist) {
        let x1 = nodelist[this.i].x;
        let y1 = nodelist[this.i].y;
        let x2 = nodelist[this.j].x;
        let y2 = nodelist[this.j].y;
        line(x1, y1, x2, y2); // TODO: prettier
        text(this.type + "=" + this.value, (x1+x2)/2.0, (y1+y2)/2.0);
    }
}

// Strictly for GUI. Fancy algos / number crunching should be done *outside* of this class.
class Network {
    constructor() {
        //            GROUND              V_IN                V_OUT
        this.nodes = [new Node(600, 600), new Node(200, 200), new Node(1000, 200)];
        this.GROUND = 0;
        this.V_IN = 1;
        this.V_OUT = 2;
        
        this.edges = [];
        this.p_mp = false; //pmousepressed

        this.edge_gui_phase = "first";
        this.edge_gui_memory = 0;
    }
    // Returns the impedance (adjecancy) matrix for the nodes in this circuit as a list of complex numbers
    // Requires a specific angular frequency as input!
    get_graph(w) {
        let matrix = [...Array(this.nodes.length)].map(e => Array(this.nodes.length).fill(Z_open()));
        for(let e of this.edges) {
            matrix[e.i][e.j] = e.get_impedance(w);
            matrix[e.j][e.i] = matrix[e.i][e.j];
        }
        return matrix;
    }

    get_gain(w) {
        let mat = this.get_graph(w);
        let Z_in = get_equivalent_impedance(mat, this.V_IN, this.GROUND);
        mat[this.GROUND][this.V_IN] = c_small();
        mat[this.V_IN][this.GROUND] = c_small();
        let Z_out = get_equivalent_impedance(mat, this.V_IN, this.V_OUT);
        let gain = cdiv(Z_out, Z_in);
        return gain;
    }
    // Updates GUI / drawing / circuit construction
    update() {
        let mouse_clicked = false;
        mouse_clicked = this.p_mp && !mouseIsPressed;
        this.p_mp = mouseIsPressed;
        if(MIM == "N") {
            ellipse(mouse.x, mouse.y, 10, 10);
            if(mouse_clicked) {
                this.nodes.push(new Node(mouse.x, mouse.y));
            }
        } else if(MIM == "W" || MIM == "R" || MIM == "C" || MIM == "L") {
            // handle all edge construction in the same spot
            if(this.edge_gui_phase == "first") {
                let k = this.get_nearest_node();
                noFill();
                stroke(electron);
                ellipse(this.nodes[k].x, this.nodes[k].y, 30, 30);
                if(mouse_clicked) {
                    this.edge_gui_memory = k;
                    this.edge_gui_phase = "second";
                }
            } else if(this.edge_gui_phase == "second") {
                let k = this.get_nearest_node(this.edge_gui_memory);
                noFill();
                stroke(electron);
                ellipse(this.nodes[k].x, this.nodes[k].y, 30, 30);
                ellipse(this.nodes[this.edge_gui_memory].x, this.nodes[this.edge_gui_memory].y, 30, 30);
                line(this.nodes[k].x, this.nodes[k].y, this.nodes[this.edge_gui_memory].x, this.nodes[this.edge_gui_memory].y);
                if(mouse_clicked) {
                    this.add_edge(k, this.edge_gui_memory, MIM);
                    this.edge_gui_memory = -1;
                    this.edge_gui_phase = "first";
                }
            }
        } else {
            this.edge_gui_memory = -1;
            this.edge_gui_phase = "first";
        }
        
    }
    add_edge(i, j, type) {
        let e = new Edge(i, j, type, 1.0); // TODO: value editing
        this.edges.push(e);
    }
    // returns id of node nearest to mouse
    // optional argument lets you exclude a specific node from the candidates
    // returns -1 if no nodes
    get_nearest_node(ignore_id=-1) {
        let min_dist = 1000000000;
        let best_id = -1;
        for(let i = 0; i < this.nodes.length; i++) {
            let n = this.nodes[i];
            let dist = (mouse.x-n.x)*(mouse.x-n.x)+(mouse.y-n.y)*(mouse.y-n.y);
            if(dist < min_dist && ignore_id != i) {
                min_dist = dist;
                best_id = i;
            }
        }
        return best_id;
    }
    display() {
        fill(electron);
        noStroke();
        for(let n of this.nodes) {
            n.display();
        }
        stroke(electron);
        for(let e of this.edges) {
            e.display(this.nodes);
        }
    }
}