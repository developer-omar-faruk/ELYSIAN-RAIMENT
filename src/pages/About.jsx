import React, { useState } from "react";
import { FaFacebookF, FaWhatsapp } from "react-icons/fa";
import { useStore } from "../store.jsx";
import { emailOk, Img, Reveal, Container, SectionHead, Field, MUTED, field, btnDark, btnLine } from "../ui.jsx";

export default function About() {
  const { notify, brand, contact, categories } = useStore();
  const [f, setF] = useState({ name: "", email: "", subject: "", message: "" }); const [er, setEr] = useState({});
  const submit = (e) => {
    e.preventDefault(); const x = {};
    if (!f.name.trim()) x.name = "Name is required.";
    if (!emailOk(f.email)) x.email = "Enter a valid email.";
    if (!f.subject.trim()) x.subject = "Subject is required.";
    if (f.message.trim().length < 10) x.message = "Message should be at least 10 characters.";
    setEr(x); if (Object.keys(x).length) return;
    if (contact.email) {
      const body = `${f.message}\n\n— ${f.name} (${f.email})`;
      window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent(f.subject)}&body=${encodeURIComponent(body)}`;
      notify("Opening your email app…");
    } else notify("Please contact us by phone or WhatsApp.", "err");
    setF({ name: "", email: "", subject: "", message: "" });
  };
  const pillars = [["Our Mission", "To make beautiful, modest and modern clothing accessible to every woman in Bangladesh."], ["Our Vision", "To become the most trusted name in women's fashion, known for quality and care."], ["Product Quality", "Every garment is checked for fabric, stitching and finish before it leaves us."], ["Customer Satisfaction", "Easy exchanges, honest sizing and responsive support, always."]];
  const items = [["Phone", contact.phone && <a key="phone" href={`tel:${contact.phone}`} className="hover:text-[#C5A16A]">{contact.phoneDisplay || contact.phone}</a>], ["Email", contact.email && <a key="email" href={`mailto:${contact.email}`} className="hover:text-[#C5A16A]">{contact.email}</a>], ["Address", contact.address], ["Hours", contact.hours]].filter((i) => i[1]);
  return (
    <>
      <Container className="py-12 md:py-20 grid lg:grid-cols-2 gap-10 items-center">
        <Reveal><p className="text-[11px] tracking-[0.3em] uppercase text-[#C5A16A] mb-3">About {brand.name}</p><h1 className="font-serif text-4xl md:text-6xl leading-tight">Dressed with intention, made with care.</h1>
          <p className={`mt-6 leading-relaxed ${MUTED}`}>{brand.description || `${brand.name} began with a simple idea: everyday clothing can be both modest and beautiful.`}</p>
          <p className={`mt-4 leading-relaxed ${MUTED}`}>We pick fabrics for comfort in Bangladesh's climate and finish every piece with details you'll notice and love.</p></Reveal>
        {categories.length > 1 && <Reveal><div className="grid grid-cols-2 gap-3"><Img src={categories[0].image} alt={categories[0].name} className="w-full aspect-[4/5]" /><Img src={categories[1].image} alt={categories[1].name} className="w-full aspect-[4/5] mt-8" /></div></Reveal>}
      </Container>
      <section className="bg-[#FAF7F1] py-16"><Container><SectionHead eyebrow="Why shop with us" title="What We Stand For" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{pillars.map(([t, d]) => <Reveal key={t} className="bg-white border border-[#E8DDCA] p-6"><h3 className="font-serif text-xl">{t}</h3><p className={`text-sm mt-3 leading-relaxed ${MUTED}`}>{d}</p></Reveal>)}</div></Container></section>
      <section id="contact" className="py-16 md:py-24 scroll-mt-20"><Container className="grid lg:grid-cols-2 gap-10">
        <div><SectionHead eyebrow="Get in touch" title="Contact Us" text="Questions about sizing, orders or exchanges? We're happy to help." />
          <ul className="space-y-4 text-sm">{items.map(([l, v]) => <li key={l}><span className={`block text-xs uppercase tracking-widest ${MUTED}`}>{l}</span>{v}</li>)}</ul>
          <div className="flex gap-3 mt-6">
            {contact.facebook && <a href={contact.facebook} target="_blank" rel="noreferrer" className={`px-5 py-3 text-sm flex items-center gap-2 ${btnLine}`}><FaFacebookF size={12} />Facebook</a>}
            {contact.whatsapp && <a href={contact.whatsapp} target="_blank" rel="noreferrer" className={`px-5 py-3 text-sm flex items-center gap-2 ${btnDark}`}><FaWhatsapp />WhatsApp</a>}</div></div>
        <form onSubmit={submit} noValidate className="bg-white border border-[#E8DDCA] p-6 space-y-4">
          <Field label="Name" error={er.name}><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={field} /></Field>
          <Field label="Email" error={er.email}><input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className={field} /></Field>
          <Field label="Subject" error={er.subject}><input value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} className={field} /></Field>
          <Field label="Message" error={er.message}><textarea rows={5} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} className={field} /></Field>
          <button className={`w-full py-3.5 text-sm ${btnDark}`}>Send Message</button>
        </form>
      </Container></section>
    </>
  );
}