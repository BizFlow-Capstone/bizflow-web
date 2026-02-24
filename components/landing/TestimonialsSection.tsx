"use client";

import React, { useState, useEffect, useRef } from "react";
import { Quote } from "lucide-react";
import BlurText from "@/components/reactbits/BlurText";
import { motion, useInView, AnimatePresence } from "motion/react";

const testimonials = [
  {
    id: 1,
    quote:
      "Trước đây cô ghi sổ tay, cuối ngày cộng tiền rất cực mà hay sai. Từ khi dùng hệ thống này, nhập hàng - bán hàng - tồn kho đều rõ ràng trên điện thoại, cô dễ kiểm soát hơn hẳn.",
    name: "Cô Nguyễn Thị Lan",
    role: "Chủ tiệm tạp hóa Lan Chi",
    image:
      "https://cdn2.fptshop.com.vn/unsafe/1920x0/filters:format(webp):quality(75)/2024_4_1_638475615440846954_tap-hoa-gan-day.jpeg?auto=format&fit=crop&q=80&w=200&h=200",
  },
  {
    id: 2,
    quote:
      "Cô lớn tuổi nên không rành máy tính, nhưng dùng rồi mới thấy đơn giản. Bán xong là hệ thống tự ghi, cuối tháng xem lời lỗ rất rõ, không còn phải lục lại sổ như trước.",
    name: "Cô Trần Thị Hồng",
    role: "Chủ tiệm tạp hóa Hồng Phát",
    image:
      "https://cdn-kvweb.kiotviet.vn/kiotviet-website/wp-content/uploads/2017/12/dai-ly-ban-buon-hang-tap-hoa-nguon-thu-khung-den-tu-dau-1.jpg?auto=format&fit=crop&q=80&w=200&h=200",
  },
  {
    id: 3,
    quote:
      "Quầy thuốc phải quản lý tồn kho và hạn sử dụng rất kỹ. Từ khi chuyển sang dùng phần mềm, cô theo dõi được số lượng, nhập - xuất rõ ràng, làm sổ sách cũng nhẹ đầu hơn nhiều.",
    name: "Cô Phạm Thị Hằng",
    role: "Chủ quầy thuốc tư nhân",
    image:
      "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg6RdAxxvR17MyfVIzC22FBEEETA7JfVYF2DVdorSsIdBMmRo7qF9kscPrNhkjImbBigq0-kRG8ZOT2uaJkpwMJWSiXST3fe1e5-rhyphenhyphen0TBv8k-eLXld0C94dcpy1Q8jeU7RbL8UwENnwvA/s1600/thuoc-dong-y-ngay-truoc.jpg?auto=format&fit=crop&q=80&w=200&h=200",
  },
];

export default function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const handleDotClick = (index: number) => {
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((current) =>
        current === testimonials.length - 1 ? 0 : current + 1,
      );
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const activeTestimonial = testimonials[activeIndex];

  return (
    <section
      id="testimonials"
      className="bg-slate-50 py-24 font-sans"
      ref={sectionRef}
    >
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center mb-16">
          <BlurText
            text="Khách Hàng Nói Gì Về Chúng Tôi"
            delay={80}
            animateBy="words"
            direction="top"
            stepDuration={0.35}
            className="text-4xl font-bold tracking-tight text-[#1e3a5f] mb-4"
          />
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-slate-500 text-lg max-w-2xl mx-auto"
          >
            Niềm tin từ hơn 1000+ đối tác, tiểu thương và hộ kinh doanh trên
            toàn quốc.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 grid gap-8"
        >
          <div className="mx-auto w-full max-w-4xl rounded-2xl bg-white p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative overflow-hidden transition-all duration-300 hover:shadow-lg">
            <div className="absolute top-6 right-8 text-slate-100">
              <Quote size={80} fill="currentColor" />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTestimonial.id}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10"
              >
                <div className="shrink-0 relative group">
                  <motion.div
                    className="absolute inset-0 bg-[#1e3a5f] rounded-xl opacity-10"
                    animate={{ rotate: [6, 12, 6] }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  <img
                    src={activeTestimonial.image}
                    alt={activeTestimonial.name}
                    className="h-24 w-24 md:h-28 md:w-28 rounded-xl object-cover shadow-md relative z-10 border-2 border-white"
                  />
                </div>

                <div className="text-center md:text-left flex-1">
                  <p className="text-lg md:text-xl leading-relaxed text-slate-700 italic font-medium">
                    &quot;{activeTestimonial.quote}&quot;
                  </p>

                  <div className="mt-6 border-t border-slate-100 pt-6">
                    <h4 className="text-xl font-bold text-[#1e3a5f]">
                      {activeTestimonial.name}
                    </h4>
                    <p className="text-sm font-medium text-slate-500 mt-1 uppercase tracking-wide">
                      {activeTestimonial.role}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-8 flex items-center justify-center gap-3">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                aria-label={`Go to testimonial ${index + 1}`}
                className={`transition-all duration-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:ring-offset-2 ${
                  activeIndex === index
                    ? "h-3 w-12 bg-[#1e3a5f]"
                    : "h-3 w-3 bg-slate-300 hover:bg-slate-400"
                }`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
