import React from 'react'

const Table = ({ columns, data }) => (
  <div className="overflow-x-auto rounded-xl shadow-lg bg-[#181d23]">
    <table className="min-w-full text-sm text-left">
      <thead>
        <tr>
          {columns.map(col => (
            <th key={col} className="px-4 py-3 bg-[#22272e] text-[#9caaba] font-semibold">{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, idx) => (
          <tr key={idx} className="border-b border-[#22272e] hover:bg-[#23282f] transition">
            {Object.values(row).map((val, i) => (
              <td key={i} className="px-4 py-3">{val}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

export default Table
