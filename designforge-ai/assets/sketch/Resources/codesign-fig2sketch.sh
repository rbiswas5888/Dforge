#!/bin/sh

# Copyright © 2024 Sketch. All rights reserved.
#
# This script does manual code signing in fig2sketch because it requires different entitlements
# to those of the main target. 'Code sign on Copy' in disabled in 'Embed fig2sketch Tool' build
# phase because of that. If run, codesign will replace any existing signature and a message will
# appear in the build log.
# Note: Does not run in Debug configurations to save time and avoid requiring internet connection.

if [ "$CONFIGURATION" != "Debug" ]; then
echo "Running codesign on fig2sketch"
codesign --force -o runtime --timestamp \
-i com.bohemiancoding.fig2sketch \
--entitlements "$SRCROOT/Other Sources/Fig2SketchUnsandboxed.entitlements" \
--sign "$EXPANDED_CODE_SIGN_IDENTITY" \
"$TARGET_BUILD_DIR/$EXECUTABLE_FOLDER_PATH/fig2sketch"
else
echo "Skipping codesign on fig2sketch for Debug configuration"
fi

# Update the run script phase's declared output stamp so Xcode can track incremental builds.
/usr/bin/touch "$SCRIPT_OUTPUT_FILE_0"
