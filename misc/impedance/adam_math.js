// @author Adam

// Complex Numbers
class Cpl {
    constructor(a, b) {
        this.re = a;
        this.im = b;
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
    return new Cpl(a.re*b.re - a.im*b.im, a.re*b.im + a.im*b.re);
}
function cdiv(a, b) {
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
// Matrices (TODO)