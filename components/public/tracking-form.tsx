import { ArrowRight, MapPin, PackageCheck, ShieldCheck } from "lucide-react";

type TrackingFormProps = {
  compact?: boolean;
  defaultValue?: string;
  id?: string;
};

export function TrackingForm({ compact = false, defaultValue = "", id = "tracking-number" }: TrackingFormProps) {
  if (compact) {
    return (
      <form className="tracking-form tracking-form--compact" action="/track" method="get">
        <label htmlFor={id}>Tracking number</label>
        <div className="tracking-form__field">
          <PackageCheck aria-hidden="true" size={19} />
          <input
            id={id}
            name="number"
            type="text"
            minLength={4}
            maxLength={64}
            pattern="[A-Za-z0-9][A-Za-z0-9-]{3,63}"
            defaultValue={defaultValue}
            placeholder="LG1234-ABCD"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            required
          />
          <button type="submit">
            <span>Track</span>
            <ArrowRight aria-hidden="true" size={18} />
          </button>
        </div>
      </form>
    );
  }

  return (
    <form className="hero-track-card" id="track" action="/track" method="get">
      <div className="hero-track-card__top">
        <div className="hero-track-card__icon"><PackageCheck aria-hidden="true" size={23} /></div>
        <div className="hero-track-card__secure"><ShieldCheck aria-hidden="true" size={15} /> Secure lookup</div>
      </div>
      <p className="public-kicker">Shipment tracking</p>
      <h2>Where is your cargo?</h2>
      <p className="hero-track-card__copy">Enter the reference from your shipping confirmation for the latest route update.</p>
      <label htmlFor={id}>Tracking number</label>
      <div className="hero-track-card__field">
        <input
          id={id}
          name="number"
          type="text"
          minLength={4}
          maxLength={64}
          pattern="[A-Za-z0-9][A-Za-z0-9-]{3,63}"
          placeholder="e.g. LG1234-ABCD"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          aria-describedby={`${id}-help`}
          required
        />
        <button type="submit" aria-label="Track shipment">
          <ArrowRight aria-hidden="true" size={20} />
        </button>
      </div>
      <div className="hero-track-card__meta" id={`${id}-help`}>
        <MapPin aria-hidden="true" size={14} /> Live updates from collection to delivery
      </div>
    </form>
  );
}
