import background from "../assets/background-atas-tangan-edukasi.webp";
import heroLogo from "../assets/logo-tangan-edukasi.webp";
import smallLogo from "../assets/logo-baru-tangan-edukasi.webp";

const galleryFiles = import.meta.glob("../assets/portfolio/tandu-osoji-*.webp", {
  eager: true,
  import: "default",
});

export const images = {
  background,
  heroLogo,
  smallLogo,
};

export const portfolio = Object.entries(galleryFiles)
  .map(([path, src]) => ({
    number: Number(path.match(/tandu-osoji-(\d+)\.webp$/)?.[1]),
    src,
  }))
  .filter(({ number }) => number >= 42 && number <= 76)
  .sort((a, b) => a.number - b.number);

export const flagshipPhoto = galleryFiles["../assets/portfolio/tandu-osoji-57.webp"];

export const navigation = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Programs", to: "/programs" },
  { label: "Portfolio", to: "/portfolio" },
  { label: "Daily Activity", to: "/clean-log" },
  { label: "Collaboration", to: "/collaboration" },
];

const pageSequence = [...navigation, { label: "Impact", to: "/programs/impact" }];

export function getNextPage(pathname) {
  const currentIndex = pageSequence.findIndex(({ to }) => to === pathname);
  return pageSequence[(currentIndex + 1) % pageSequence.length] ?? pageSequence[0];
}

export const programs = [
  {
    number: "01",
    title: "Kenal Alam",
    icon: "leaf",
    summary: "Belajar tentang tanaman, satwa, dan ekosistem lewat pengalaman yang dekat dengan keseharian.",
    details: "Amati lingkungan sekitar, kenali kebutuhan makhluk hidup, dan pahami bagaimana setiap unsur saling berhubungan.",
  },
  {
    number: "02",
    title: "Kurangi Sampah",
    icon: "recycle",
    summary: "Jadikan kebiasaan ramah lingkungan terasa mudah, kreatif, dan bisa dimulai dari rumah.",
    details: "Bawa tas belanja dan botol minum sendiri, gunakan kembali barang yang masih layak, serta pisahkan sampah sesuai jenisnya.",
  },
  {
    number: "03",
    title: "Aksi Bareng",
    icon: "users",
    summary: "Berkolaborasi dalam kegiatan seru dan sebarkan semangat peduli bumi ke lebih banyak orang.",
    details: "Ajak keluarga, teman, dan komunitas memilih aksi bersama, lalu ceritakan hasilnya sebagai inspirasi.",
  },
  {
    number: "04",
    title: "Clean Up",
    icon: "sparkles",
    summary: "Aksi bersih-bersih bersama untuk menjaga ruang publik dan lingkungan sekitar tetap nyaman.",
    details: "Pilih area aman, gunakan perlengkapan yang sesuai, pisahkan sampah yang dikumpulkan, dan salurkan ke fasilitas yang tepat.",
  },
];

export const values = [
  { letter: "R", name: "Resonance", description: "Mendengarkan dan merespons kebutuhan serta konteks masyarakat." },
  { letter: "O", name: "Ownership", description: "Membangun rasa kepemilikan bersama atas proses dan dampak." },
  { letter: "K", name: "Knowledge", description: "Menjadikan pengetahuan sebagai dasar untuk belajar dan bertindak." },
  { letter: "I", name: "Integrity", description: "Menjaga tanggung jawab dan konsistensi dalam setiap kolaborasi." },
];

export const approach = [
  { number: "01", title: "EDUCATE", description: "Meningkatkan pemahaman masyarakat." },
  { number: "02", title: "ENGAGE", description: "Membangun keterlibatan aktif." },
  { number: "03", title: "ACTIVATE", description: "Mendorong aksi nyata di lapangan." },
];

export const impact = [
  { number: "01", name: "Awareness", description: "Peningkatan kesadaran terhadap isu dan lingkungan sekitar." },
  { number: "02", name: "Participation", description: "Keterlibatan aktif dalam kegiatan dan solusi bersama." },
  { number: "03", name: "Behavior Change", description: "Perubahan perilaku yang tumbuh menjadi kebiasaan baik." },
];

export const partners = [
  "Masyarakat",
  "Pemerintah",
  "Sektor swasta",
  "Komunitas",
];

export const contactPhone = "+62 857 6689 0353";
export const contactWhatsapp = "https://wa.me/6285766890353";
