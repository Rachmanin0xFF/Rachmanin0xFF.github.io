// @author Adam

// Complex Numbers
class Cpl {
    constructor(a, b) {
        this.re = a;
        this.im = b;
    }
    print_self() {
        print(this.get_str());
    }
    get_str() {
        return "(" + this.re + " + " + this.im + "j" + ")";
    }
}
function c_one() {
    return new Cpl(1.0, 0.0);
}
function c_i() {
    return new Cpl(0.0, 1.0);
}
function c_infty() {
    return new Cpl(Infinity, 0.0);
}
function c_zero() {
    return new Cpl(0.0, 0.0);
}
function cmod(x) {
    return sqrt(x.re*x.re+x.im*x.im)
}
function cabs(z) {
    return mod(z);
}
function carg(z) {
    return atan2(z.im, z.re);
}
function cmult(z, a) {
    return new Cpl(z.re*a, z.im*a);
}
function cdiv(z, a) {
    return new Cpl(z.re/a, z.im/a);
}
function cmult(a, b) {
    if(a.re === Infinity || b.re === Infinity) return c_infty();
    return new Cpl(a.re*b.re - a.im*b.im, a.re*b.im + a.im*b.re);
}
function cdiv(a, b) {
    if(b.re === Infinity) return c_zero();
    let r2 = 1.0/(b.re*b.re + b.im*b.im);
    return new Cpl(r2*(a.re*b.re+a.im*b.im), r2*(a.im*b.re - a.re*b.im));
}
function cadd(a, b) {
    return new Cpl(a.re + b.re, a.im + b.im);
}
function csub(a, b) {
    return new Cpl(a.re - b.re, a.im - b.im);
}
function cexp(z) {
    let r = exp(z.re);
    return new Cpl(r*cos(z.im), r*sin(z.im));
}
function cconj(z) {
    return new Cpl(z.re, -z.im);
}
function cpow(z, n) {
    let r = pow(mod(z), n);
    let phi = arg(z);
    return new Cpl(r*cos(n*phi), r*sin(n*phi));
}
// Circuit wrappers
function resistance(value) {
    return new Cpl(value, 0);
}
function reactance(value) {
    return new Cpl(0, value);
}

function Z_capacitor(w, C) {
    return reactance(-1.0/(w*C));
}
function Z_inductor(w, L) {
    return reactance(w*L);
}
function Z_resistor(w, R) {
    return resistance(R);
}
function Z_wire() {
    return c_zero();
}
function Z_open() {
    return c_infty();
}
function parallel(Z_a, Z_b) {
    if(Z_a.re === Infinity) return Z_b;
    if(Z_b.re === Infinity) return Z_a;
    return cdiv(cmult(Z_a, Z_b), cadd(Z_a, Z_b));
}
function series(Z_a, Z_b) {
    if(Z_a.re === Infinity || Z_b.re === Infinity) return c_infty();
    return cadd(Z_a, Z_b);
}

// Matrices

function star_mesh_reduce(matrix, index) {
    let Z_inv_total = c_zero();
    for(let i = 0; i < matrix.length; i++) {
        if(i != index) {
            Z_inv_total = cadd(Z_inv_total, cdiv(c_one(), matrix[i][index]));
        }
    }
    let matrix_out = [...Array(matrix.length)].map(e => Array(matrix.length).fill(Z_open()));
    for(let i = 0; i < matrix_out.length; i++) {
        if(i != index) {
            for(let j = 0; j < i; j++) {
                if(j != index) {
                    matrix_out[i][j] = parallel(cmult(cmult(matrix[j][index], matrix[i][index]), Z_inv_total), matrix[i][j]);
                    matrix_out[j][i] = matrix_out[i][j];
                }
            }
            matrix_out[i][i] = c_zero();
        }
    }
    return matrix_out;
}

function get_equivalent_impedance(matrix, node_A, node_B) {
    for(let k = 0; k < matrix.length; k++) {
        if(k != node_A && k != node_B)
            matrix = star_mesh_reduce(matrix, k);
    }
    return matrix[node_A][node_B];
}

function print_matrix(m) {
    print("MATRIX:")
    print("======================");
    for(let i = 0; i < m.length; i++) {
        let s = "";
        for(let j = 0; j < m[i].length; j++) {
            s += m[i][j].get_str() + " ";
        }
        print(s);
    }
    print("======================");
}