# Frizerescu Barber Shop - Website

Site web modern și responsive pentru Frizerescu Barber Shop, o frizerie profesională din Pipera, Voluntari.

## 🚀 Caracteristici

- **Design modern și responsive** - optimizat pentru desktop, tablet și mobile
- **Culori bazate pe logo** - schemă de culori negru și alb pentru un aspect profesional
- **Informații complete** - detalii despre ambele locații (Pipera și Kaufland)
- **Recenzii reale** - afișarea recenziilor de pe Google și MERO
- **Programări online** - linkuri directe către platforma MERO
- **Optimizat pentru SEO** - structură HTML semantică și meta tags
- **Performanță ridicată** - cod optimizat și lazy loading

## 📍 Locațiile

### Frizerescu Pipera
- **Adresa**: Bulevardul Pipera, nr 36, Pipera (Voluntari)
- **Telefon**: 0758 720 970
- **Rating**: 4.99/5 (4364 recenzii)
- **Program**: Luni-Vineri 9:00-20:00, Sâmbătă 9:00-18:00, Duminică închis

### Frizerescu Kaufland Pipera
- **Adresa**: Bulevardul Pipera 2/IX, Voluntari (în Kaufland)
- **Telefon**: 0750 235 222
- **Rating**: 4.97/5 (378 recenzii)
- **Program**: Luni-Miercuri 9:00-20:00, Joi 9:00-19:00, Vineri-Sâmbătă 9:00-20:00, Duminică 9:00-17:00

## 🛠️ Tehnologii utilizate

- **HTML5** - structura semantică
- **CSS3** - stilizare modernă cu CSS Grid și Flexbox
- **JavaScript** - funcționalități interactive
- **Google Fonts** - tipografia Poppins
- **Font Awesome** - iconuri moderne
- **Responsive Design** - adaptare automată la toate dispozitivele

## 📁 Structura proiectului

```
/
├── index.html          # Pagina principală
├── styles.css          # Stilurile CSS
├── script.js           # Funcționalități JavaScript
├── logo.png            # Logo-ul frizeriei (de adăugat)
├── README.md           # Documentația proiectului
└── CNAME               # Fișier pentru domeniul custom (de creat)
```

## 🌐 Configurare GitHub Pages cu domeniu .ro

### Pasul 1: Crearea repository-ului
1. Creează un repository nou pe GitHub
2. Încarcă toate fișierele în repository
3. Mergi la Settings → Pages
4. Selectează sursa: Deploy from a branch
5. Alege branch-ul `main` și folder-ul `/ (root)`

### Pasul 2: Configurarea domeniului custom
1. Creează un fișier `CNAME` în root-ul proiectului
2. Adaugă numele domeniului tău (ex: `frizerescu.ro`)
3. Salvează și commit fișierul

### Pasul 3: Configurarea DNS la furnizorul de domeniu
Adaugă următoarele înregistrări DNS:

**Înregistrări A:**
```
@    A    185.199.108.153
@    A    185.199.109.153
@    A    185.199.110.153
@    A    185.199.111.153
```

**Înregistrare CNAME:**
```
www    CNAME    username.github.io
```

### Pasul 4: Activarea HTTPS
1. În GitHub Pages settings, bifează "Enforce HTTPS"
2. Așteaptă câteva minute pentru propagarea certificatului SSL

## 🎨 Personalizare

### Culori
Culoarea principală și secundară pot fi modificate în fișierul `styles.css`:
```css
:root {
    --primary-color: #000000;      /* Negru - culoarea principală */
    --secondary-color: #ffffff;    /* Alb - culoarea secundară */
    --accent-color: #333333;       /* Gri închis - accent */
}
```

### Logo
1. Adaugă logo-ul în format PNG cu numele `logo.png`
2. Dimensiunea recomandată: 200x80px sau similar
3. Fundal transparent pentru integrare optimă

### Conținut
Modifică conținutul în fișierul `index.html`:
- Textele din secțiuni
- Informațiile de contact
- Linkurile către platformele de programare

## 📱 Optimizări mobile

Site-ul este complet responsive și include:
- Meniu hamburger pentru mobile
- Butoane mari pentru touch
- Text lizibil pe ecrane mici
- Imagini adaptative
- Navigare optimizată

## 🔍 SEO și performanță

- Meta tags optimizate pentru motoarele de căutare
- Structură HTML semantică
- Lazy loading pentru imagini
- Minificarea codului CSS și JavaScript
- Service Worker pentru caching

## 📞 Programări

Site-ul direcționează utilizatorii către:
- **MERO Pipera**: https://mero.ro/p/frizerescu
- **MERO Kaufland**: https://mero.ro/p/frizerescu-kaufland

## 🚀 Deployment

1. Fork sau clone acest repository
2. Modifică conținutul după necesități
3. Adaugă logo-ul frizeriei
4. Creează fișierul CNAME cu domeniul tău
5. Configurează DNS-ul la furnizorul de domeniu
6. Activează GitHub Pages în settings

## 📈 Monitorizare

Pentru a monitoriza performanța site-ului, poți integra:
- Google Analytics
- Google Search Console
- Google PageSpeed Insights

## 🤝 Suport

Pentru întrebări sau modificări, contactează dezvoltatorul sau consultă documentația GitHub Pages.

## 📄 Licență

Acest proiect este creat pentru Frizerescu Barber Shop. Toate drepturile rezervate.
