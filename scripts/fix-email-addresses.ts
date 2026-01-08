import { supabaseAdmin } from '../lib/supabase-server'

/**
 * Script to fix incorrectly parsed email addresses in the received_emails table
 *
 * This script re-processes the from_email and from_name fields for all existing emails
 * that were parsed with the buggy regex before the fix on 2026-01-08.
 *
 * The bug caused emails like "Kevin Thubert <kevin.thubert@gmail.com>" to be parsed as:
 * - from_name: "K"
 * - from_email: "evin.thubert@gmail.com"
 *
 * This script will correct those records.
 */

// Same resolveAddress function as in the fixed webhook handler
const resolveAddress = (
  value: unknown
): { name: string | null; email: string | null } => {
  if (!value) {
    return { name: null, email: null }
  }

  if (typeof value === 'string') {
    // Handle format: "Name <email@domain.com>"
    const bracketMatch = value.match(/^(.+?)\s*<([^>]+)>$/)
    if (bracketMatch) {
      return {
        name: bracketMatch[1].trim() || null,
        email: bracketMatch[2].trim(),
      }
    }

    // Handle format: "<email@domain.com>" (no name)
    const emailOnlyBracket = value.match(/^<([^>]+)>$/)
    if (emailOnlyBracket) {
      return {
        name: null,
        email: emailOnlyBracket[1].trim(),
      }
    }

    // Handle format: "email@domain.com" (plain email)
    if (value.includes('@')) {
      return {
        name: null,
        email: value.trim(),
      }
    }

    // Fallback: treat as email
    return {
      name: null,
      email: value.trim(),
    }
  }

  return { name: null, email: null }
}

// Reconstruct the original "from" value from the buggy parsing
// This helps us re-parse it correctly
const reconstructOriginalFrom = (
  fromName: string | null,
  fromEmail: string
): string => {
  // If we have both name and email, and the email looks malformed (doesn't start with a letter)
  // it's likely the bug split "Name <email>" incorrectly

  // Check if this looks like buggy data:
  // - from_name is a single character
  // - from_email doesn't start with the same character as from_name
  if (fromName && fromName.length === 1) {
    // This is likely buggy data like: name="K", email="evin.thubert@gmail.com"
    // Reconstruct as: "Kevin.thubert@gmail.com" (we lost the full name, but can fix the email)
    const reconstructedEmail = fromName + fromEmail
    return reconstructedEmail
  }

  // If name exists and looks normal, return formatted
  if (fromName) {
    return `${fromName} <${fromEmail}>`
  }

  // Otherwise just return the email
  return fromEmail
}

async function fixEmailAddresses() {
  console.log('🔧 Starting email address fix script...\n')

  try {
    // Fetch all emails from the database
    const { data: emails, error: fetchError } = await supabaseAdmin
      .from('received_emails')
      .select('id, from_email, from_name, created_at')
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('❌ Error fetching emails:', fetchError)
      return
    }

    if (!emails || emails.length === 0) {
      console.log('ℹ️  No emails found in database')
      return
    }

    console.log(`📧 Found ${emails.length} emails to check\n`)

    let fixedCount = 0
    let skippedCount = 0

    for (const email of emails) {
      const { id, from_email, from_name, created_at } = email

      // Check if this looks like buggy data
      const looksLikeBug = from_name && from_name.length === 1

      if (!looksLikeBug) {
        skippedCount++
        continue
      }

      console.log(`\n🔍 Analyzing email ID ${id} (received: ${created_at})`)
      console.log(`   Current: name="${from_name}", email="${from_email}"`)

      // Reconstruct the original "from" value
      const reconstructed = reconstructOriginalFrom(from_name, from_email)
      console.log(`   Reconstructed: "${reconstructed}"`)

      // Re-parse with the fixed function
      const parsed = resolveAddress(reconstructed)
      console.log(`   Fixed: name="${parsed.name}", email="${parsed.email}"`)

      // Only update if we actually fixed something
      if (parsed.email !== from_email || parsed.name !== from_name) {
        const { error: updateError } = await supabaseAdmin
          .from('received_emails')
          .update({
            from_email: parsed.email,
            from_name: parsed.name,
          })
          .eq('id', id)

        if (updateError) {
          console.error(`   ❌ Error updating email ${id}:`, updateError)
        } else {
          console.log(`   ✅ Updated successfully`)
          fixedCount++
        }
      } else {
        console.log(`   ⏭️  No changes needed`)
        skippedCount++
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log(`✅ Fix complete!`)
    console.log(`   Fixed: ${fixedCount} emails`)
    console.log(`   Skipped: ${skippedCount} emails`)
    console.log(`   Total: ${emails.length} emails`)
    console.log('='.repeat(60))
  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  }
}

// Run the script
fixEmailAddresses()
  .then(() => {
    console.log('\n✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })
