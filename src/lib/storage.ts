import { supabase } from './supabase';

/**
 * Upload a file to the employee assets bucket
 */
export async function uploadEmployeeImage(
  empCode: string, 
  file: File
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${empCode}_${Date.now()}.${fileExt}`;
    const filePath = `profile-images/${fileName}`;

    console.log('Uploading file:', fileName, 'to bucket: employee-assets');

    // Upload file
    const { data, error: uploadError } = await supabase.storage
      .from('employee-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { success: false, error: uploadError.message };
    }

    console.log('File uploaded successfully:', data);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('employee-assets')
      .getPublicUrl(filePath);

    console.log('Generated public URL:', publicUrl);

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('Upload exception:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Update employee profile image in the database
 */
export async function updateEmployeeProfileImage(
  empCode: string, 
  imageUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('employees')
      .update({ 
        profile_image: imageUrl,
        updated_at: new Date().toISOString()
      })
      .eq('emp_code', empCode);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
