import React from 'react'

const SectionCard = ({ icon, title, description, children }) => (
  <section className="mb-10">
    <div className="flex items-center gap-3 mb-2">
      <span className="text-2xl">{icon}</span>
      <h3 className="text-xl font-semibold">{title}</h3>
    </div>
    {description && <p className="text-[#9caaba] mb-4">{description}</p>}
    <div className="bg-[#181d23] rounded-2xl shadow-xl p-6 border border-[#23282f]">
      {children}
    </div>
  </section>
)

export default SectionCard
