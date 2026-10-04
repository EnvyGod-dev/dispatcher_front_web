import React from 'react';
import { PrivacyPolicyHeader } from './privacy-policy-header';
import { PrivacyPolicySection } from './privacy-policy-section';
import { PrivacyPolicyContact } from './privacy-policy-contact';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* geometric pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px),
                           repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)`,
          }}
        />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <PrivacyPolicyHeader />

        <div className="mt-12 space-y-1">
          <PrivacyPolicySection
            number="1"
            title="Мэдээлэл цуглуулах"
            content="Бид уул уурхайн компаниудын төлөөлөл, мэргэжилтнүүдийн хувийн мэдээллийг (нэр, цахим хаяг, утасны дугаар, компани, ажлын байршил, зэрэг бусад холбогдох мэдээлэл) бүртгэх замаар тэдний техник технологийн ажлын бүртгэлийг хийх зорилготой."
          />

          <PrivacyPolicySection
            number="2"
            title="Мэдээллийн хэрэглээ"
            content="Цуглуулсан мэдээллийг бид дараах зорилгоор ашиглана:"
            items={[
              'Хэрэглэгчдэд үйлчилгээ үзүүлэх, тайлангийн боловсруулалт хийх',
              'Уул уурхайн компанийн үйл ажиллагаа, техник технологийн явцад дүн шинжилгээ хийх',
              'Шинэ бүтээгдэхүүн, үйлчилгээ, хямдралын талаар мэдээлэх',
              'Сайтын чанар, үйлчилгээг сайжруулах',
            ]}
          />

          <PrivacyPolicySection
            number="3"
            title="Мэдээллийг хуваалцах"
            content="Бид таны хувийн мэдээллийг гуравдагч этгээдтэй хуваалцахгүй. Хууль зүйн шаардлагаар, эсвэл таны зөвшөөрөлтэйгээр л мэдээллийг хуваалцана."
          />

          <PrivacyPolicySection
            number="4"
            title="Мэдээллийн аюулгүй байдал"
            content="Танай мэдээллийг хамгаалахын тулд бид хамгийн шилдэг технологи, системийн арга хэмжээг хэрэгжүүлж, мэдээллийн аюулгүй байдлыг хангахад анхаарна. Гэвч интернетийн аюулгүй байдал 100% баталгаатай байдаггүйг анхаарна уу."
          />

          <PrivacyPolicySection
            number="5"
            title="Нууцлалын бодлогын өөрчлөлт"
            content="Энэхүү нууцлалын бодлогыг цаг хугацааны явцад шинэчлэх боломжтой. Бид өөрчлөлтийн талаар хэрэглэгчдэд мэдэгдэнэ."
          />

          <PrivacyPolicySection
            number="6"
            title="Хэрэглэгчийн эрх"
            content="Хэрэглэгчид өөрийн мэдээллийг хянах, засварлах, устгах, эсвэл бидэнд хүсэлт гаргах эрхтэй."
          />
        </div>

        <PrivacyPolicyContact />
      </div>
    </div>
  );
}
