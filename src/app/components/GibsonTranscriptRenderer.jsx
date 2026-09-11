"use client";

import React from "react";

export default function GibsonTranscriptRenderer({ data }) {
  if (!data) return null;

  return (
    <div className="w-full max-w-[980px] bg-white text-black p-6 sm:p-10 shadow-2xl rounded-sm border border-gray-300 font-serif text-sm mx-auto leading-normal">
      {/* 1. Header 3-Column Section */}
      <div className="grid grid-cols-12 gap-2 border-b border-gray-400 pb-3 mb-3 items-center">
        {/* Left: QR Code & Short Name */}
        <div className="col-span-3 flex flex-col items-center justify-center text-center">
          {data.qrCodeDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.qrCodeDataUrl}
              alt="Transcript QR Code"
              className="w-[125px] h-[125px] object-contain block mb-1 border border-gray-200"
            />
          ) : (
            <div className="w-[125px] h-[125px] border border-dashed border-gray-400 flex items-center justify-center text-xs text-gray-500 mb-1">
              QR Code
            </div>
          )}
          <div className="font-bold text-xs tracking-wide text-gray-900">
            {data.studentShortName || "Chrstian A"}
          </div>
        </div>

        {/* Center: School Banner / Info */}
        <div className="col-span-6 flex flex-col items-center text-center px-1">
          {data.bannerDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.bannerDataUrl}
              alt="Gibson School Systems"
              className="max-h-[90px] w-auto object-contain mx-auto block mb-1"
            />
          ) : (
            <>
              <h1 className="text-xl font-bold tracking-tight text-gray-950 uppercase underline decoration-1 underline-offset-2">
                Gibson School Systems
              </h1>
              <p className="italic text-xs font-semibold text-gray-800 mt-0.5">
                Gibson Youth Academy and Gibson Preparatory College
              </p>
              <div className="flex justify-between w-full text-[10px] italic text-gray-600 px-4 mt-0.5">
                <span>Making Young People Strong People</span>
                <span>Making Strong People Stronger</span>
              </div>
            </>
          )}

          <p className="text-[10px] italic text-gray-700 mt-1 leading-tight">
            Central Administrative Office, Phones: 011-662-8312 or 011-661-0150
          </p>
          <p className="text-[10px] italic text-gray-700 leading-tight">
            P.O. Box 15564 Addis Ababa, Ethiopia. https://gyaschool.com, info@gyaschool.net
          </p>

          <h2 className="text-sm font-bold underline decoration-2 underline-offset-4 uppercase tracking-widest text-black mt-2">
            Student Transcript
          </h2>
        </div>

        {/* Right: Photo Placeholder Box */}
        <div className="col-span-3 flex flex-col items-center justify-center text-center">
          <div className="w-[100px] h-[120px] border border-black bg-gray-50 flex items-center justify-center mb-1">
            <span className="text-gray-300 text-xs">Photo</span>
          </div>
          <p className="text-[9px] text-gray-700 leading-tight max-w-[120px]">
            Note: The photo is an actual photo, not a scanned photo.
          </p>
        </div>
      </div>

      {/* 2. Student Info Bar */}
      <div className="flex flex-wrap items-center justify-between text-xs sm:text-sm font-semibold border-b border-black pb-2 mb-3 px-1 gap-2">
        <div>
          <span>Name of the student: </span>
          <span className="font-bold underline uppercase ml-1">{data.studentName}</span>
        </div>
        <div>
          <span>Age: </span>
          <span className="font-bold underline ml-1">{data.age}</span>
        </div>
        <div>
          <span>Gender: </span>
          <span className="font-bold underline ml-1">{data.gender}</span>
        </div>
        <div>
          <span>Stream: </span>
          <span className="font-bold underline ml-1">{data.stream}</span>
        </div>
      </div>

      {/* 3. Grades Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-black text-center text-xs">
          <thead>
            {/* Header Row 1: Grade Columns */}
            <tr className="bg-gray-100/70">
              <th
                rowSpan={2}
                className="border border-black px-2 py-1 text-left font-bold text-xs w-[190px]"
              >
                Subjects
              </th>
              <th colSpan={3} className="border border-black px-1 py-1 font-bold text-[11px]">
                Grade: 9<br />
                <span className="font-normal text-[10px] block">
                  Aca. Year: {data.years.g9 || ""}
                </span>
              </th>
              <th colSpan={3} className="border border-black px-1 py-1 font-bold text-[11px]">
                Grade: 10<br />
                <span className="font-normal text-[10px] block">
                  Aca. Year: {data.years.g10 || ""}
                </span>
              </th>
              <th colSpan={3} className="border border-black px-1 py-1 font-bold text-[11px]">
                Grade: 11<br />
                <span className="font-normal text-[10px] block">
                  Aca. Year: {data.years.g11 || ""}
                </span>
              </th>
              <th colSpan={3} className="border border-black px-1 py-1 font-bold text-[11px]">
                Grade: 12<br />
                <span className="font-normal text-[10px] block">
                  Aca. Year: {data.years.g12 || ""}
                </span>
              </th>
            </tr>

            {/* Header Row 2: Semesters */}
            <tr className="bg-gray-100/70 text-[10px] font-semibold">
              {/* G9 */}
              <th className="border border-black px-1 py-0.5 w-[50px]">1st Sem</th>
              <th className="border border-black px-1 py-0.5 w-[50px]">2nd Sem</th>
              <th className="border border-black px-1 py-0.5 w-[50px]">Average</th>
              {/* G10 */}
              <th className="border border-black px-1 py-0.5 w-[50px]">1st Sem</th>
              <th className="border border-black px-1 py-0.5 w-[50px]">2nd Sem</th>
              <th className="border border-black px-1 py-0.5 w-[50px]">Average</th>
              {/* G11 */}
              <th className="border border-black px-1 py-0.5 w-[50px]">1st Sem</th>
              <th className="border border-black px-1 py-0.5 w-[50px]">2nd Sem</th>
              <th className="border border-black px-1 py-0.5 w-[50px]">Average</th>
              {/* G12 */}
              <th className="border border-black px-1 py-0.5 w-[50px]">1st Sem</th>
              <th className="border border-black px-1 py-0.5 w-[50px]">2nd Sem</th>
              <th className="border border-black px-1 py-0.5 w-[50px]">Average</th>
            </tr>
          </thead>

          <tbody>
            {data.gradeRows.map((row, idx) => {
              const isSummaryRow =
                row.subject.toLowerCase() === "total" ||
                row.subject.toLowerCase() === "average" ||
                row.subject.toLowerCase() === "rank" ||
                row.subject.toLowerCase().includes("conduct");

              return (
                <tr
                  key={idx}
                  className={`hover:bg-gray-50/50 ${
                    isSummaryRow ? "font-bold bg-gray-50/70" : ""
                  }`}
                >
                  <td className="border border-black px-2 py-0.5 text-left font-medium text-[11px] whitespace-nowrap">
                    {row.subject}
                  </td>
                  {/* Grade 9 */}
                  <td className="border border-black px-1 py-0.5 text-[11px]">{row.g9[0]}</td>
                  <td className="border border-black px-1 py-0.5 text-[11px]">{row.g9[1]}</td>
                  <td className="border border-black px-1 py-0.5 text-[11px]">{row.g9[2]}</td>
                  {/* Grade 10 */}
                  <td className="border border-black px-1 py-0.5 text-[11px]">{row.g10[0]}</td>
                  <td className="border border-black px-1 py-0.5 text-[11px]">{row.g10[1]}</td>
                  <td className="border border-black px-1 py-0.5 text-[11px]">{row.g10[2]}</td>
                  {/* Grade 11 */}
                  <td className="border border-black px-1 py-0.5 text-[11px]">{row.g11[0]}</td>
                  <td className="border border-black px-1 py-0.5 text-[11px]">{row.g11[1]}</td>
                  <td className="border border-black px-1 py-0.5 text-[11px]">{row.g11[2]}</td>
                  {/* Grade 12 */}
                  <td className="border border-black px-1 py-0.5 text-[11px]">{row.g12[0]}</td>
                  <td className="border border-black px-1 py-0.5 text-[11px]">{row.g12[1]}</td>
                  <td className="border border-black px-1 py-0.5 text-[11px]">{row.g12[2]}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 4. Footer Signatures & Authenticity Section */}
      <div className="mt-4 pt-3 border-t border-black text-xs">
        <p className="font-semibold mb-3">
          He/ She has completed grade 9, 10 and 11 and 12.
        </p>

        <div className="grid grid-cols-12 gap-3 items-end mt-4">
          <div className="col-span-5 space-y-2">
            <div>
              <span className="font-medium">Record Keeper’s Name: </span>
              <span className="border-b border-black inline-block w-40"></span>
            </div>
            <div>
              <span className="font-medium">Signature: </span>
              <span className="border-b border-black inline-block w-28"></span>
              <span className="ml-2 font-medium">Date: </span>
              <span className="border-b border-black inline-block w-20"></span>
            </div>
          </div>

          <div className="col-span-5 space-y-2">
            <div>
              <span className="font-medium">Site Director’s Name: </span>
              <span className="border-b border-black inline-block w-40"></span>
            </div>
            <div>
              <span className="font-medium">Signature: </span>
              <span className="border-b border-black inline-block w-28"></span>
              <span className="ml-2 font-medium">Date: </span>
              <span className="border-b border-black inline-block w-20"></span>
            </div>
          </div>

          <div className="col-span-2 flex justify-end">
            <div className="w-24 h-16 border border-dashed border-gray-600 flex items-center justify-center text-[10px] text-gray-500 text-center p-1">
              School Seal
            </div>
          </div>
        </div>

        <div className="mt-5 text-center text-[10px] text-gray-600 italic border-t border-gray-300 pt-2">
          Do not accept scanned or electronic verisons of this document unless sent directly from Gibson School System
        </div>
      </div>
    </div>
  );
}
