'use client'

export function ContactForm(): React.ReactElement {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault()
    const form = e.currentTarget
    const name = (form.elements.namedItem('name') as HTMLInputElement).value
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const subject = (form.elements.namedItem('subject') as HTMLSelectElement).value
    const message = (form.elements.namedItem('message') as HTMLTextAreaElement).value
    const body = `Name: ${name}%0AEmail: ${email}%0A%0A${encodeURIComponent(message)}`
    window.location.href = `mailto:support@uptrue.io?subject=${encodeURIComponent(subject)}&body=${body}`
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="contact-form-row">
        <label htmlFor="contact-name" className="contact-label">Your Name</label>
        <input type="text" id="contact-name" name="name" required className="contact-input" placeholder="Jane Smith" />
      </div>
      <div className="contact-form-row">
        <label htmlFor="contact-email" className="contact-label">Email Address</label>
        <input type="email" id="contact-email" name="email" required className="contact-input" placeholder="jane@company.com" />
      </div>
      <div className="contact-form-row">
        <label htmlFor="contact-subject" className="contact-label">Subject</label>
        <select id="contact-subject" name="subject" required className="contact-input" defaultValue="">
          <option value="" disabled>Select a subject</option>
          <option value="General enquiry">General Enquiry</option>
          <option value="Agency enquiry">Agency Enquiry</option>
          <option value="Partnership">Partnership</option>
          <option value="Billing">Billing</option>
          <option value="Feature request">Feature Request</option>
        </select>
      </div>
      <div className="contact-form-row">
        <label htmlFor="contact-message" className="contact-label">Message</label>
        <textarea id="contact-message" name="message" required className="contact-input contact-textarea" placeholder="Tell us how we can help..." rows={6} />
      </div>
      <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
        Send Message
      </button>
    </form>
  )
}
