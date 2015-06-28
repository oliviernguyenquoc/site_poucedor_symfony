<?php

namespace Pouce\TeamBundle\Trajet;

class PouceTrajet
{
	/*

	 */
	public function location($ville,$pays)
	{
		$stringLocation=$ville.', '.$pays;
		$url='http://nominatim.openstreetmap.org/search?q=' . urlencode ($stringLocation) . '&format=json&addressdetails=1';
		$jsonFile=file_get_contents($url);
		$response = json_decode($jsonFile,true);
		return $response;
	}

	public function calculDistance($longDepart,$latDepart,$longArrivee,$latArrivee)
	{
		$url='http://router.project-osrm.org/viaroute?loc='.$latDepart.','.$longDepart.'&loc='.$latArrivee.','.$longArrivee;
		exit(\Doctrine\Common\Util\Debug::dump($url));
		$jsonFile=file_get_contents($url);
		$response = json_decode(file_get_contents($url));
		return $response["route_summary"]["total_distance"];
	}
}