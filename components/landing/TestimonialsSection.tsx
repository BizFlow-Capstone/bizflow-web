const testimonials = [
  {
    quote:
      '"My experience with Mark is a complete success, from customer service, wide range of products, clean store, purchasing experience, the newsletter.Thank you."',
    name: "Leona Paul",
    role: "CEO of Railcare",
  },
];

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="bg-slate-50 py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center">
          <h2 className="text-4xl font-semibold tracking-tight text-[#1e3a5f]">
            Đánh Giá của khách hàng
          </h2>
        </div>

        <div className="mt-12 grid gap-6">
          <div className="mx-auto max-w-3xl rounded-xl bg-white p-10 shadow-sm">
            <div className="flex items-start gap-6">
              <div className="h-20 w-20 flex-shrink-0 rounded-lg bg-slate-200" />
              <div>
                <p className="text-lg leading-relaxed text-slate-700">
                  {testimonials[0].quote}
                </p>
                <p className="mt-6 font-semibold text-slate-900">
                  {testimonials[0].name}
                </p>
                <p className="text-sm text-slate-500">{testimonials[0].role}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2">
            <span className="h-2.5 w-10 rounded-full bg-[#1e3a5f]" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          </div>
        </div>
      </div>
    </section>
  );
}
