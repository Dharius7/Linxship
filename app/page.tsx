import Image from "next/image";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Container,
  Globe2,
  Headphones,
  Layers3,
  MapPinned,
  PackageOpen,
  Plane,
  Quote,
  Route,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  Warehouse,
} from "lucide-react";
import { ContactForm } from "@/components/public/contact-form";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { TrackingForm } from "@/components/public/tracking-form";
import "./public.css";

const services = [
  {
    title: "Air freight",
    tag: "Fast & precise",
    copy: "Time-critical and high-value cargo managed with careful handling and responsive coordination.",
    image: "/images/air-freight.jpg",
    icon: Plane,
    alt: "Cargo aircraft being prepared for air freight",
    points: ["Priority routing", "Careful handling", "Clear documentation"],
  },
  {
    title: "Ocean freight",
    tag: "Global reach",
    copy: "Flexible sea freight through a dependable carrier network, from single pallets to full containers.",
    image: "/images/ocean-freight.jpg",
    icon: Container,
    alt: "Container ship transporting ocean freight",
    points: ["FCL & LCL options", "Carrier coordination", "Customs support"],
  },
  {
    title: "Road transport",
    tag: "Door to door",
    copy: "Reliable local and cross-border road transport built around your delivery window and cargo needs.",
    image: "/images/road-freight.jpg",
    icon: Truck,
    alt: "Freight truck on a road delivery route",
    points: ["Flexible collection", "Route planning", "Last-mile delivery"],
  },
  {
    title: "Secure storage",
    tag: "Ready when you are",
    copy: "Professional warehousing and coordinated release, giving your goods a secure stop between journeys.",
    image: "/images/warehouse-hero.jpg",
    icon: Warehouse,
    alt: "Organised logistics warehouse with stored cargo",
    points: ["Safe warehousing", "Inventory visibility", "Planned dispatch"],
  },
];

const process = [
  {
    number: "01",
    title: "Tell us the route",
    copy: "Share what is moving, where it starts, and where it needs to arrive.",
    icon: PackageOpen,
  },
  {
    number: "02",
    title: "We build the plan",
    copy: "Our team coordinates the right mode, documents, handling, and timing.",
    icon: Route,
  },
  {
    number: "03",
    title: "Follow every mile",
    copy: "Use your tracking reference for clear events and direct team updates.",
    icon: MapPinned,
  },
  {
    number: "04",
    title: "Receive with confidence",
    copy: "We stay with the shipment through final delivery and confirmation.",
    icon: CheckCircle2,
  },
];

const testimonials = [
  {
    quote: "The customer service is some of the best we have experienced with ocean freight. The team keeps us informed and makes each shipment feel manageable.",
    name: "Paul",
    detail: "Ocean freight customer",
  },
  {
    quote: "Their team goes above and beyond our expectations. They are responsive, efficient, and always make delivery straightforward.",
    name: "Robert",
    detail: "Business customer",
  },
  {
    quote: "The drivers are friendly and professional, and turnaround is consistently quick. We have trusted the team for years.",
    name: "Michael",
    detail: "Long-term customer",
  },
];

export default function HomePage() {
  return (
    <div className="public-site">
      <a className="public-skip-link" href="#main-content">Skip to main content</a>
      <SiteHeader />

      <main id="main-content" tabIndex={-1}>
        <section className="home-hero" id="home">
        <div className="home-hero__media" aria-hidden="true">
          <Image
            src="/images/warehouse-hero.jpg"
            alt=""
            fill
            preload
            sizes="100vw"
            className="home-hero__image"
          />
        </div>
        <div className="home-hero__veil" />
        <div className="public-shell home-hero__content">
          <div className="home-hero__copy">
            <p className="public-eyebrow public-eyebrow--lime">
              <Globe2 aria-hidden="true" size={16} /> Worldwide logistics, made personal
            </p>
            <h1>Cargo moves.<br /><em>Confidence</em> stays.</h1>
            <p className="home-hero__lede">
              Air, ocean, road, and secure storage coordinated by one experienced team—with a clear view of every mile.
            </p>
            <div className="home-hero__actions">
              <a className="public-button public-button--lime" href="#track">
                Track your shipment <ArrowDownRight aria-hidden="true" size={18} />
              </a>
              <a className="public-text-link public-text-link--light" href="#services">
                Explore our services <ArrowRight aria-hidden="true" size={17} />
              </a>
            </div>
            <div className="home-hero__proof" aria-label="Service benefits">
              <span><CheckCircle2 aria-hidden="true" size={17} /> Door-to-door support</span>
              <span><CheckCircle2 aria-hidden="true" size={17} /> Clear status updates</span>
            </div>
          </div>

          <TrackingForm />
        </div>

        <div className="public-shell home-hero__rail" aria-label="Core services">
          <span><b>01</b> Air freight</span>
          <span><b>02</b> Ocean freight</span>
          <span><b>03</b> Road transport</span>
          <span><b>04</b> Secure storage</span>
        </div>
      </section>

      <section className="home-intro" aria-label="Our promise">
        <div className="public-shell home-intro__grid">
          <p className="public-eyebrow"><Sparkles aria-hidden="true" size={15} /> Logistics without the guesswork</p>
          <h2>One team from collection to final delivery.</h2>
          <p>We combine practical freight experience, careful handling, and direct communication so your supply chain feels simpler—even when the route is not.</p>
        </div>
        <div className="public-shell home-intro__benefits">
          <article><ShieldCheck aria-hidden="true" /><div><h3>Handled with care</h3><p>Plans shaped around your cargo, timing, and risk.</p></div></article>
          <article><Clock3 aria-hidden="true" /><div><h3>Updates that matter</h3><p>Clear milestones, without chasing for answers.</p></div></article>
          <article><Headphones aria-hidden="true" /><div><h3>Human support</h3><p>A responsive team when you need context or help.</p></div></article>
        </div>
      </section>

      <section className="home-services public-section" id="services">
        <div className="public-shell">
          <div className="public-section-heading">
            <div>
              <p className="public-eyebrow">What we move</p>
              <h2>Every route needs<br />the right mode.</h2>
            </div>
            <p>From urgent air cargo to long-haul sea freight and the final road mile, we coordinate each handoff as part of one connected journey.</p>
          </div>

          <div className="services-grid">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <article className="service-card" key={service.title}>
                  <div className="service-card__media">
                    <Image src={service.image} alt={service.alt} fill sizes="(max-width: 700px) 100vw, (max-width: 1050px) 50vw, 25vw" />
                    <span>0{index + 1}</span>
                  </div>
                  <div className="service-card__body">
                    <div className="service-card__heading">
                      <Icon aria-hidden="true" size={24} />
                      <p>{service.tag}</p>
                    </div>
                    <h3>{service.title}</h3>
                    <p>{service.copy}</p>
                    <ul>
                      {service.points.map((point) => <li key={point}><Check aria-hidden="true" size={14} /> {point}</li>)}
                    </ul>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="home-about public-section" id="about">
        <div className="public-shell home-about__grid">
          <div className="home-about__visual">
            <div className="home-about__image home-about__image--main">
              <Image src="/images/logistics-team.jpg" alt="Freight professional coordinating cargo inside a logistics facility" fill sizes="(max-width: 800px) 100vw, 48vw" />
            </div>
            <div className="home-about__image home-about__image--small">
              <Image src="/images/road-freight.jpg" alt="Freight vehicle ready for a planned route" fill sizes="(max-width: 600px) 44vw, 230px" />
            </div>
            <div className="home-about__badge"><Globe2 aria-hidden="true" /><strong>Worldwide</strong><span>Connected freight support</span></div>
          </div>

          <div className="home-about__copy">
            <p className="public-eyebrow">The Lion Gold approach</p>
            <h2>Complex logistics.<br />Calm coordination.</h2>
            <p className="home-about__lead">Lion Gold Shipping &amp; Storage provides practical transportation, customs support, and warehousing for cargo moving around the world.</p>
            <p>Our work is built on thoughtful planning, transparent communication, and a team that stays accountable from the first conversation to the final handoff.</p>
            <div className="home-about__checks">
              <span><CheckCircle2 aria-hidden="true" /> One point of coordination</span>
              <span><CheckCircle2 aria-hidden="true" /> Flexible route planning</span>
              <span><CheckCircle2 aria-hidden="true" /> Customer-first updates</span>
              <span><CheckCircle2 aria-hidden="true" /> Secure cargo handling</span>
            </div>
            <Link className="public-button public-button--dark" href="#contact">Plan a shipment <ArrowRight aria-hidden="true" size={18} /></Link>
          </div>
        </div>
      </section>

      <section className="home-process public-section" id="process">
        <div className="home-process__rings" aria-hidden="true" />
        <div className="public-shell">
          <div className="public-section-heading public-section-heading--light">
            <div>
              <p className="public-eyebrow public-eyebrow--lime">From brief to doorstep</p>
              <h2>A clear path forward.</h2>
            </div>
            <p>Every shipment has moving parts. Our process keeps them connected, visible, and easy to understand.</p>
          </div>

          <div className="process-grid">
            {process.map((step) => {
              const Icon = step.icon;
              return (
                <article className="process-card" key={step.number}>
                  <span>{step.number}</span>
                  <Icon aria-hidden="true" />
                  <h3>{step.title}</h3>
                  <p>{step.copy}</p>
                </article>
              );
            })}
          </div>

          <div className="home-process__cta">
            <div><Layers3 aria-hidden="true" /><p><strong>Already on the move?</strong><br />Get the latest event in seconds.</p></div>
            <a href="#track">Track a shipment <ArrowRight aria-hidden="true" /></a>
          </div>
        </div>
      </section>

      <section className="home-testimonials public-section" aria-labelledby="testimonials-title">
        <div className="public-shell">
          <div className="public-section-heading">
            <div>
              <p className="public-eyebrow">Trusted along the way</p>
              <h2 id="testimonials-title">Good service is<br />felt at every handoff.</h2>
            </div>
            <p>Responsive support, professional handling, and a team that keeps customers in the picture.</p>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <figure className="testimonial-card" key={testimonial.name}>
                <div className="testimonial-card__top">
                  <div aria-label="5 out of 5 stars">{Array.from({ length: 5 }, (_, star) => <Star key={star} aria-hidden="true" size={14} fill="currentColor" />)}</div>
                  <Quote aria-hidden="true" size={30} />
                </div>
                <blockquote>“{testimonial.quote}”</blockquote>
                <figcaption><span>0{index + 1}</span><div><strong>{testimonial.name}</strong><small>{testimonial.detail}</small></div></figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="home-contact public-section" id="contact">
        <div className="public-shell home-contact__grid">
          <div className="home-contact__intro">
            <p className="public-eyebrow public-eyebrow--lime">Start a conversation</p>
            <h2>What are we<br />moving next?</h2>
            <p>Tell us what you need and our team will help shape the route, timing, and service around your cargo.</p>
            <div className="home-contact__details">
              <a href="mailto:info@liongoldss.com"><span>Email us</span><strong>info@liongoldss.com</strong></a>
              <div><span>Opening hours</span><strong>Mon–Fri, 10:00–18:00</strong><small>Saturday, 10:00–14:00</small></div>
              <div><span>Location</span><strong>New York, NY 11226</strong><small>United States</small></div>
            </div>
          </div>
          <div className="home-contact__form-wrap">
            <div className="home-contact__form-heading">
              <p>Shipment enquiry</p>
              <span>All fields are handled securely.</span>
            </div>
            <ContactForm />
          </div>
        </div>
      </section>

      </main>

      <SiteFooter />
    </div>
  );
}
