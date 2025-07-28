import { Employee } from "@/lib/supabase";

export function generateVCard(employee: Employee): string {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${employee.name}`,
    `N:${employee.name.split(' ').reverse().join(';')};;;`,
  ];

  // Organization and title
  if (employee.designation) {
    lines.push(`TITLE:${employee.designation}`);
  }
  if (employee.dept) {
    lines.push(`ORG:Coal India - SECL;${employee.dept}`);
  }

  // Phone numbers
  if (employee.phone_1) {
    lines.push(`TEL;TYPE=WORK,VOICE:${employee.phone_1}`);
  }
  if (employee.phone_2) {
    lines.push(`TEL;TYPE=WORK,VOICE:${employee.phone_2}`);
  }

  // Email
  if (employee.email_id) {
    lines.push(`EMAIL;TYPE=WORK:${employee.email_id}`);
  }

  // Address
  if (employee.present_address) {
    lines.push(`ADR;TYPE=WORK:;;${employee.present_address};;;;`);
  }

  // Notes
  const notes = [];
  if (employee.emp_code) notes.push(`Employee Code: ${employee.emp_code}`);
  if (employee.grade) notes.push(`Grade: ${employee.grade}`);
  if (employee.category) notes.push(`Category: ${employee.category}`);
  if (employee.area_name) notes.push(`Area: ${employee.area_name}`);
  if (employee.unit_name) notes.push(`Unit: ${employee.unit_name}`);
  if (employee.blood_group) notes.push(`Blood Group: ${employee.blood_group}`);
  
  if (notes.length > 0) {
    lines.push(`NOTE:${notes.join('\\n')}`);
  }

  // Profile photo
  if (employee.profile_image) {
    // Note: For simplicity, we're adding the URL. 
    // In a real implementation, you might want to embed the base64 image
    lines.push(`PHOTO;VALUE=URI:${employee.profile_image}`);
  }

  lines.push("END:VCARD");
  
  return lines.join("\r\n");
}

export function downloadVCard(employee: Employee) {
  const vcard = generateVCard(employee);
  const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${employee.name.replace(/\s+/g, '_')}.vcf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export async function shareContact(employee: Employee) {
  const vcard = generateVCard(employee);
  
  // Try Web Share API first (better for mobile)
  if (navigator.share && navigator.canShare) {
    try {
      const file = new File([vcard], `${employee.name}.vcf`, { type: "text/vcard" });
      const shareData = {
        files: [file],
        title: employee.name,
        text: `Contact: ${employee.name}`,
      };
      
      if (navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return true;
      }
    } catch (error) {
      // Fall back to download if share fails
    }
  }
  
  // Fallback to download
  downloadVCard(employee);
  return false;
}
