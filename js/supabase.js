// Instead of importing, use the globally available supabase from CDN
// import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://klgpaihopehvotwmrvwy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsZ3BhaWhvcGVodm90d21ydnd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3MTM2NTIsImV4cCI6MjA1OTI4OTY1Mn0.F7A83zJ_iiKu0NmgsFY3LolhPtTqevO444tLdYgm5Qc';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or anonymous key is missing. Please check your environment variables.');
}

// Create the Supabase client using the globally available createClient from CDN
const { createClient } = window.supabase;
const _supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * @typedef {Object} FormSubmission
 * @property {string} [id]
 * @property {string} [created_at]
 * @property {Object} form_data
 */

/**
 * Store user locally in localStorage
 * @param {string} user - The username to save locally
 */
function storeUserLocally(user) {
  if (user) {
    localStorage.setItem('currentUser', user);
  }
}

/**
 * Get the current user from localStorage
 * @returns {string|null} - The current username or null if not found
 */
function getCurrentUser() {
  return localStorage.getItem('currentUser');
}

/**
 * Saves form submission data to Supabase
 * @param {Object} formData - The form data to save
 * @returns {Promise<{data: FormSubmission|null, error: Error|null}>}
 */
async function saveFormSubmission(formData) {
  try {
    // Get current user and include it in the form data if available
    const currentUser = getCurrentUser();
    const dataToSubmit = {
      form_data: formData,
      game: 'Oliver-Fortnite'
    };
    
    // Add user information to the submission if available
    if (currentUser) {
      dataToSubmit.form_data.user = currentUser;
    }

    const { data, error } = await _supabase
      .from('form_submissions')
      .insert([dataToSubmit])
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error saving form submission:', error);
    return { data: null, error: error };
  }
}

/**
 * Saves user data to Supabase
 * @param {string} user - The username to save
 * @returns {Promise<{data: FormSubmission|null, error: Error|null}>}
 */
async function saveUser(user) {
  try {
    // Store user locally first
    storeUserLocally(user);
    
    const { data, error } = await _supabase
      .from('tof_users')
      .insert([{ name: user, game: 'Oliver-Fortnite' }])
      .select()
      .single();
    
    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error saving form submission:', error);
    return { data: null, error: error };
  }
}

/**
 * Gets recent form submissions from Supabase
 * @returns {Promise<{data: Array<FormSubmission>|null, error: Error|null}>}
 */
async function getFormSubmissions() {
  try {
    const { data, error } = await _supabase
      .from('form_submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error retrieving form submissions:', error);
    return { data: null, error: error };
  }
}

// Create a global object for game data functions
window.GameData = {
  saveUser: saveUser,
  saveFormSubmission: saveFormSubmission,
  getFormSubmissions: getFormSubmissions,
  getCurrentUser: getCurrentUser,
  supabase: _supabase,
  ready: true
};

// Emit a custom event when Supabase is ready
document.dispatchEvent(new CustomEvent('supabase-ready'));

// Log when Supabase functions are ready
console.log('Supabase functions loaded and ready to use.'); 