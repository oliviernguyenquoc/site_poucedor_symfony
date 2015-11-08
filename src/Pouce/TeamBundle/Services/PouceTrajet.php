<?php

namespace Pouce\TeamBundle\Services;

use Symfony\Component\HttpFoundation\Request;

class PouceTrajet
{
	/*

	 */
	public function location($ville,$pays)
	{
		$stringLocation=$ville.', '.$pays;
		$url='http://nominatim.openstreetmap.org/search?q=' . urlencode ($stringLocation) . '&format=json&addressdetails=1';
		$response = $this->addInfoURLandExecute($url);
		return $response;
	}

	public function calculDistance($longDepart,$latDepart,$longArrivee,$latArrivee)
	{
		$url='http://router.project-osrm.org/viaroute?loc='.$latDepart.','.$longDepart.'&loc='.$latArrivee.','.$longArrivee;
		$response = $this->addInfoURLandExecute($url);
		return $response["route_summary"]["total_distance"];
	}

	private function addInfoURLandExecute($url) {
		$ch = curl_init();
		// set URL and other appropriate options
		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt($ch, CURLOPT_VERBOSE, FALSE);
		curl_setopt($ch, CURLOPT_HEADER, FALSE);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
		// OSRM need a valid user-agent
		$request = Request::createFromGlobals();
		$userAgent=$request->headers->get('User-Agent');
		curl_setopt($ch, CURLOPT_USERAGENT, $userAgent); //"php/OsrmRouting (X11; U; Linux ppc; en-US; rv:1.7.6) Gecko/20050328 Firefox/1.0.2"      
		// grab URL and pass it to the browser
		$content = curl_exec($ch);
		curl_close($ch);

		return json_decode($content, TRUE);
	}

}
