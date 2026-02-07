import styles from "./page.module.css";

const basePrinciples = [
  {
    title: "Design Tokens",
    description: "กำหนดสี spacing และ typography เป็นระบบเดียวเพื่อขยายฟีเจอร์ได้ง่าย",
  },
  {
    title: "Accessible Navigation",
    description: "มีโครงสร้าง header/sidebar ที่ชัดเจนพร้อม semantic landmarks",
  },
  {
    title: "Scalable Layout",
    description: "รองรับ desktop และ tablet/mobile ตั้งแต่เริ่มต้นด้วย responsive grid",
  },
];

export default function Home() {
  return (
    <section className={styles.wrapper}>
      <div className={styles.hero}>
        <p className={styles.badge}>Refactor Phase 1</p>
        <h1>Frontend Setup + UX/UI Base พร้อมเริ่มพัฒนาฟีเจอร์จริง</h1>
        <p>
          โครงสร้างนี้เป็นฐานกลางสำหรับ CSLogbook เพื่อให้ทีมต่อยอดหน้า Student,
          Teacher และ Admin ด้วยมาตรฐานเดียวกัน
        </p>
      </div>

      <div className={styles.grid}>
        {basePrinciples.map((item) => (
          <article key={item.title} className={styles.card}>
            <h2>{item.title}</h2>
            <p>{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
