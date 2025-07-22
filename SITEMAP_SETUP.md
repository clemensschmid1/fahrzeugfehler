# Sitemap Configuration

## 🎯 **Current Setup**

This project uses a **custom sitemap structure** optimized for SEO and performance.

### ✅ **Structure:**
```
sitemap.xml (index pointing to all child sitemaps)
├── sitemap-0.xml (1000 URLs)
├── sitemap-1.xml (1000 URLs)
├── sitemap-2.xml (1000 URLs)
├── ...
└── sitemap-15.xml (505 URLs)
```

### 📊 **Benefits:**
- ✅ **SEO Optimized**: Single sitemap index pointing to all child sitemaps
- ✅ **Performance**: Each sitemap under 50MB limit
- ✅ **Scalable**: Can handle 50,000+ URLs
- ✅ **Google/Bing Compatible**: Follows sitemap protocol best practices

## 🚫 **Why `next-sitemap` is Disabled**

The `next-sitemap.config.js` file has been **disabled** to prevent conflicts:

### ❌ **Problems with `next-sitemap`:**
1. **Database Timeouts**: Fetches all URLs during build, causing timeouts
2. **Single Large File**: Creates one massive sitemap instead of index structure
3. **Build Conflicts**: Overwrites our manually created sitemap index
4. **Performance Issues**: 8GB+ daily database egress

### ✅ **Our Solution:**
- **Custom Script**: `scripts/splitSitemapIndexes.ts` creates proper index structure
- **Build Integration**: Runs automatically during `npm run build`
- **No Database Queries**: Uses existing sitemap files
- **SEO Optimized**: Follows Google/Bing best practices

## 🔧 **Build Process**

1. **Next.js Build**: `npm run build`
2. **Postbuild Script**: `npm run sitemap:split`
3. **Result**: Proper sitemap index structure

## 📝 **Files**

- `scripts/splitSitemapIndexes.ts` - Custom sitemap index generator
- `vercel.json` - Vercel configuration (prevents auto next-sitemap)
- `next-sitemap.config.js` - **DISABLED** (renamed to prevent conflicts)

## 🚀 **Deployment**

The sitemap structure is automatically generated during each deployment. No manual intervention required.

## ⚠️ **Important Notes**

- **DO NOT** re-enable `next-sitemap` - it will break the sitemap structure
- **DO NOT** rename `next-sitemap.config.js.disabled` back to `.js`
- **DO NOT** modify the `vercel.json` build command

## 🔍 **Verification**

After deployment, check:
- `infoneva.com/sitemap.xml` - Should show sitemap index
- `infoneva.com/sitemap-0.xml` - Should show 1000 URLs
- `infoneva.com/sitemap-15.xml` - Should show 505 URLs

---

**Last Updated**: January 2025
**Status**: ✅ Production Ready 